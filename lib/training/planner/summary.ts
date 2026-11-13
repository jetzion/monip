import { type Bookings, daysByMonth } from "./bookings";
import type { PlanSettings, PlanSummary, PlanTrainer, Proposal } from "./types";

/** Totals for the proposed sessions, and each trainer's days per month in the range (including existing sessions). */
export function summarize(
  proposals: Proposal[],
  shipsEligible: number,
  trainers: PlanTrainer[],
  bookings: Bookings,
  settings: PlanSettings,
): PlanSummary {
  const sessions = { online: 0, departureDay: 0, onboarding: 0 };
  for (const proposal of proposals) sessions[proposal.type] += 1;
  const costs = proposals.map((proposal) => proposal.cost);
  const firstMonth = settings.from.slice(0, 7);
  const lastMonth = settings.to.slice(0, 7);
  const load = trainers.flatMap((trainer) =>
    [...daysByMonth(bookings, trainer.id)]
      .filter(([month]) => month >= firstMonth && month <= lastMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, days]) => ({ trainerId: trainer.id, name: trainer.name, month, days, limit: trainer.maxDaysPerMonth })),
  );
  return {
    sessions,
    shipsCovered: proposals.length,
    shipsEligible,
    trips: proposals.reduce((sum, proposal) => sum + proposal.trips, 0),
    nights: proposals.reduce((sum, proposal) => sum + proposal.nights, 0),
    cost: costs.some((cost) => cost === null) ? null : costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0),
    load,
  };
}
