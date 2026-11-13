import { describeSession } from "../schedule";
import type { ItemStatus, StoredPlan } from "./stored";
import { PRESETS, type Slot } from "./types";

export type ProposalRow = {
  index: number;
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

/** Rows, summary lines, and the title for the planner page. */
export function planRows(stored: StoredPlan, trainerNames: Map<number, string>) {
  const { plan, settings } = stored;
  const name = (id: number) => trainerNames.get(id) ?? "Removed trainer";

  // Listed by start time; each row keeps its index in the stored plan for accepting.
  const byStart = <T extends { startsAt: string }>(items: T[]) =>
    items.map((item, index) => ({ item, index })).sort((a, b) => a.item.startsAt.localeCompare(b.item.startsAt));

  const proposals: ProposalRow[] = byStart(plan.proposals).map(({ item: proposal, index }) => ({
    index,
    ship: `${proposal.sailing.ship} (${proposal.sailing.cruiseLine})`,
    when: when(proposal),
    trainer: name(proposal.trainerId),
    travel: proposal.travel ? `${plural(proposal.trips, "trip")}, ${plural(proposal.nights, "night")}` : "None",
    cost: proposal.cost === null ? "Unknown" : usd.format(proposal.cost),
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
