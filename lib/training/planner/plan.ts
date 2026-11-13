import { TRAINING_TYPES } from "../schedule";
import { dayOf } from "../time";
import { book, booking, type Bookings, daysByMonth, type Place, unbook } from "./bookings";
import { ineligibleReason, slotFor } from "./slots";
import { summarize } from "./summary";
import type { Move, Plan, PlanInput, PlanSailing, PlanSession, PlanTrainer, Proposal, Slot, Unscheduled } from "./types";

const TYPES = TRAINING_TYPES.map((option) => option.value);
const longDay = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.parse(iso));

/** Training days the trainer already has in the slot's month. */
const load = (bookings: Bookings, slot: Slot) => daysByMonth(bookings, slot.trainerId).get(slot.startsAt.slice(0, 7)) ?? 0;

/**
 * Best slot for a ship among its sailings, the given trainers, and all
 * formats. Ties go to the less busy trainer, then the earlier start.
 */
function bestSlot(sailings: PlanSailing[], trainers: PlanTrainer[], input: PlanInput, bookings: Bookings): Slot | null {
  let best: Slot | null = null;
  for (const sailing of sailings) {
    for (const trainer of trainers) {
      for (const type of TYPES) {
        const slot = slotFor(sailing, trainer, type, { ...input, bookings });
        if (!slot) continue;
        const better =
          !best ||
          slot.score > best.score ||
          (slot.score === best.score &&
            (load(bookings, slot) < load(bookings, best) ||
              (load(bookings, slot) === load(bookings, best) && Date.parse(slot.startsAt) < Date.parse(best.startsAt))));
        if (better) best = slot;
      }
    }
  }
  return best;
}

function reasonFor(slot: Slot, trainer: PlanTrainer, recency: string): string {
  const port = slot.sailing.startPort ?? "the port";
  const format =
    slot.type === "online"
      ? "Online while in port (no travel)"
      : slot.type === "departureDay"
        ? `Departure day in ${port}`
        : `On board for the cruise from ${port}`;
  const from = trainer.homeBase ? `travels from ${trainer.homeBase}` : "travels (no home base set)";
  const travel = slot.type === "online" ? "" : slot.travel ? `, ${trainer.name} ${from}` : `, ${trainer.name}'s home base`;
  return `${format}${travel}; ${recency}.`;
}

/** Where an existing in-person session takes the trainer. */
function placeOf(session: PlanSession, portZones: Record<string, string>): Place | null {
  if (session.type === "online") return null;
  const endPort = session.endPort ?? session.startPort;
  return {
    startPort: session.startPort,
    endPort,
    startZone: portZones[session.startPort ?? ""] ?? null,
    endZone: portZones[endPort ?? ""] ?? null,
  };
}

/** Latest training end per ship, from existing sessions. */
function lastTrained(sessions: PlanSession[]) {
  const latest = new Map<string, string>();
  for (const session of sessions) {
    if (!latest.has(session.ship) || session.endsAt > latest.get(session.ship)!) latest.set(session.ship, session.endsAt);
  }
  return latest;
}

/**
 * Recommends training for each ship with cruises in the range: at most one
 * session per ship, priority ships first, then those trained least recently.
 * Ships no trainer can take may get a move of an existing (not fixed, future)
 * session that frees a trainer. Existing sessions are never changed here;
 * moves are proposals for the admin.
 */
export function buildPlan(input: PlanInput): Plan {
  const { settings, sessions, trainers, portZones } = input;
  const inRange = input.sailings.filter((sailing) => {
    const day = dayOf(sailing.startDate);
    return day >= settings.from && day <= settings.to && (settings.ships.length === 0 || settings.ships.includes(sailing.ship));
  });
  const byShip = new Map<string, PlanSailing[]>();
  for (const sailing of inRange) byShip.set(sailing.ship, [...(byShip.get(sailing.ship) ?? []), sailing]);

  const bookings: Bookings = new Map();
  for (const session of sessions) {
    book(bookings, session.trainerId, booking(`session:${session.id}`, session.startsAt, session.endsAt, session.timeZone, placeOf(session, portZones)));
  }

  // Ships with a session overlapping the range are already trained (range days in UTC; a day either side is close enough).
  const rangeStart = Date.parse(`${settings.from}T00:00:00Z`);
  const rangeEnd = Date.parse(`${settings.to}T23:59:59Z`);
  const covered = new Set(
    sessions
      .filter((session) => Date.parse(session.endsAt) > rangeStart && Date.parse(session.startsAt) < rangeEnd)
      .map((session) => session.ship),
  );
  const latest = lastTrained(sessions);
  const skipped: Unscheduled[] = [];
  const eligible = new Map<string, PlanSailing[]>();
  for (const [ship, shipSailings] of byShip) {
    const ok = shipSailings.filter((sailing) => !ineligibleReason(sailing, portZones));
    if (ok.length) eligible.set(ship, ok);
    else skipped.push({ ship, reason: `No cruise in the range can be planned: ${ineligibleReason(shipSailings[0], portZones)}.` });
  }

  const priority = (ship: string) => {
    const index = settings.priorityShips.indexOf(ship);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  const order = [...eligible.keys()]
    .filter((ship) => !covered.has(ship))
    .sort((a, b) => priority(a) - priority(b) || (latest.get(a) ?? "").localeCompare(latest.get(b) ?? "") || a.localeCompare(b));
  const recency = (ship: string) =>
    priority(ship) !== Number.POSITIVE_INFINITY
      ? "priority ship"
      : latest.has(ship)
        ? `last trained ${longDay(latest.get(ship)!)}`
        : "not trained before";
  const trainerById = new Map(trainers.map((trainer) => [trainer.id, trainer]));

  const proposals: Proposal[] = [];
  const waiting: string[] = [];
  for (const ship of order) {
    const slot = bestSlot(eligible.get(ship)!, trainers, input, bookings);
    if (!slot) {
      waiting.push(ship);
      continue;
    }
    book(bookings, slot.trainerId, booking(`proposal:${proposals.length}`, slot.startsAt, slot.endsAt, slot.timeZone, slot.place));
    proposals.push({ ...slot, reason: reasonFor(slot, trainerById.get(slot.trainerId)!, recency(ship)) });
  }

  const moves: Move[] = [];
  const unscheduled: Unscheduled[] = [];
  const movable = sessions.filter((session) => !session.fixed && Date.parse(session.startsAt) >= Date.parse(settings.now));
  for (const ship of waiting) {
    const move = tryMove(ship, eligible.get(ship)!, movable, moves, input, bookings, byShip);
    if (move) {
      const trainer = trainerById.get(move.slot.trainerId)!;
      book(bookings, move.slot.trainerId, booking(`proposal:${proposals.length}`, move.slot.startsAt, move.slot.endsAt, move.slot.timeZone, move.slot.place));
      proposals.push({ ...move.slot, reason: `${reasonFor(move.slot, trainer, recency(ship))} Needs a move: see Moves.` });
      moves.push(move.move);
      continue;
    }
    const started = eligible.get(ship)!.every((sailing) => Date.parse(`${dayOf(sailing.startDate)}T23:59:59Z`) < Date.parse(settings.now));
    unscheduled.push({
      ship,
      reason: started
        ? "Its cruises in the range have already started."
        : "No trainer is free during its cruises in the range, or every trainer is at their monthly limit.",
    });
  }

  return { proposals, moves, unscheduled, skipped, summary: summarize(proposals, eligible.size, trainers, bookings, settings) };
}

/** Frees a trainer for the ship by re-placing one movable session elsewhere in the range. */
function tryMove(
  ship: string,
  sailings: PlanSailing[],
  movable: PlanSession[],
  moves: Move[],
  input: PlanInput,
  bookings: Bookings,
  byShip: Map<string, PlanSailing[]>,
): { slot: Slot; move: Move } | null {
  const moved = new Set(moves.map((move) => move.session.id));
  for (const session of movable) {
    if (moved.has(session.id)) continue;
    const trainer = input.trainers.find((candidate) => candidate.id === session.trainerId);
    if (!trainer) continue;
    const key = `session:${session.id}`;
    unbook(bookings, session.trainerId, key);
    const slot = bestSlot(sailings, [trainer], input, bookings);
    if (slot) {
      book(bookings, slot.trainerId, booking("pending", slot.startsAt, slot.endsAt, slot.timeZone, slot.place));
      const own = (byShip.get(session.ship) ?? []).filter((sailing) => !ineligibleReason(sailing, input.portZones));
      const to = bestSlot(own, input.trainers, input, bookings);
      unbook(bookings, slot.trainerId, "pending");
      if (to) {
        book(bookings, to.trainerId, booking(key, to.startsAt, to.endsAt, to.timeZone, to.place));
        const reason = `Frees ${trainer.name} for ${ship}, which could not be trained otherwise.`;
        return { slot, move: { session, to, reason } };
      }
    }
    book(bookings, session.trainerId, booking(key, session.startsAt, session.endsAt, session.timeZone, placeOf(session, input.portZones)));
  }
  return null;
}
