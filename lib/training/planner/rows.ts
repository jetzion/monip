import { describeSession, type TrainingType } from "../schedule";
import type { ItemStatus, StoredPlan } from "./stored";
import { PRESETS, type Slot } from "./types";

/** Current choices of a proposal, as the editor starts them. */
export type ProposalValues = { cruise: number; trainer: number; type: TrainingType; startTime: string | null };

export type ProposalRow = {
  index: number;
  /** Ship name alone, to find its cruises for editing. */
  shipName: string;
  values: ProposalValues;
  ship: string;
  when: string;
  trainer: string;
  travel: string;
  cost: string;
  reason: string;
  status: ItemStatus | null;
};

export type MoveRow = { index: number; ship: string; from: string; to: string; reason: string; status: ItemStatus | null };

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const day = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.parse(value));
const month = (value: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.parse(`${value}-15`));
const when = (slot: Pick<Slot, "type" | "startsAt" | "endsAt" | "timeZone">) => describeSession(slot);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export const travelText = (slot: Pick<Slot, "travel" | "trips" | "nights">) =>
  slot.travel ? `${plural(slot.trips, "trip")}, ${plural(slot.nights, "night")}` : "None";
export const costText = (slot: Pick<Slot, "cost">) => (slot.cost === null ? "Unknown" : usd.format(slot.cost));
export const whenText = (slot: Pick<Slot, "type" | "startsAt" | "endsAt" | "timeZone">) => describeSession(slot);

/** Rows, summary lines, and the title for the planner page. */
export function planRows(stored: StoredPlan, trainerNames: Map<number, string>) {
  const { plan, settings } = stored;
  const name = (id: number) => trainerNames.get(id) ?? "Removed trainer";

  // Listed by start time; each row keeps its index in the stored plan for accepting.
  const byStart = <T extends { startsAt: string }>(items: T[]) =>
    items.map((item, index) => ({ item, index })).sort((a, b) => a.item.startsAt.localeCompare(b.item.startsAt));

  const proposals: ProposalRow[] = byStart(plan.proposals).map(({ item: proposal, index }) => ({
    index,
    shipName: proposal.sailing.ship,
    values: { cruise: proposal.sailing.id, trainer: proposal.trainerId, type: proposal.type, startTime: proposal.fields.startTime ?? null },
    ship: `${proposal.sailing.ship} (${proposal.sailing.cruiseLine})`,
    when: when(proposal),
    trainer: name(proposal.trainerId),
    travel: travelText(proposal),
    cost: costText(proposal),
    reason: proposal.reason,
    status: stored.proposalStatus[index] ?? null,
  }));

  const moves: MoveRow[] = byStart(plan.moves.map((move) => ({ ...move, startsAt: move.to.startsAt }))).map(({ item: move, index }) => ({
    index,
    ship: move.session.ship,
    from: `${when(move.session)}, ${name(move.session.trainerId)}`,
    to: `${when(move.to)}, ${name(move.to.trainerId)}`,
    reason: move.reason,
    status: stored.moveStatus[index] ?? null,
  }));

  const { summary } = plan;
  const lines = [
    `${summary.shipsCovered} of ${plural(summary.shipsEligible, "plannable ship")} planned: ${summary.sessions.departureDay} departure day, ${summary.sessions.onboarding} onboarding, ${summary.sessions.online} online.`,
    `${plural(summary.trips, "trip")} and ${plural(summary.nights, "hotel night")} away from home base.`,
    summary.cost === null
      ? "Estimated cost: unknown (fill in Training planning costs)."
      : `Estimated cost: ${usd.format(summary.cost)}.`,
    ...(plan.moves.length ? [`${plural(plan.moves.length, "move")} of existing sessions suggested.`] : []),
  ];
  const load = summary.load.map(
    (entry) => `${entry.name}, ${month(entry.month)}: ${plural(entry.days, "training day")}${entry.limit ? ` of ${entry.limit} allowed` : " (no monthly limit)"}`,
  );

  const preset = PRESETS.find((option) => option.value === settings.preset)?.label ?? settings.preset;
  const title = `${preset} plan for cruises starting ${day(settings.from)} – ${day(settings.to)}`;
  const made = `Made ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(Date.parse(stored.createdAt))} UTC by ${stored.createdBy}.`;

  return { title, made, proposals, moves, lines, load, unscheduled: plan.unscheduled, skipped: plan.skipped };
}
