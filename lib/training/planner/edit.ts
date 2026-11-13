import { describeSession, type TrainingType } from "../schedule";
import { dayOf, isTime, zonedTime } from "../time";
import { book, booking, type Bookings, clash, trainingDays, travelClash, travelGap, withinMonthlyLimit } from "./bookings";
import { placeOf, reasonFor } from "./plan";
import { ruleViolations } from "./rules";
import { buildSlot, cruiseNights, ineligibleReason, onlineStart } from "./slots";
import type { StoredPlan } from "./stored";
import { summarize } from "./summary";
import type { PlanInput, Proposal, Slot } from "./types";

/** What the admin changed on a proposed session. */
export type Change = { cruise: number; trainer: number; type: TrainingType; startTime?: string | null };

export type EditCheck = { slot: Slot; warnings: string[] } | { error: string };

const accepted = (stored: StoredPlan, kind: "proposal" | "move", index: number) =>
  (kind === "proposal" ? stored.proposalStatus : stored.moveStatus)[index]?.status === "accepted";

/**
 * Trainers' time as the plan expects it: sessions in the schedule (accepted
 * items are already there), pending moves at their new times, and the other
 * proposals not yet accepted.
 */
export function planBookings(input: PlanInput, stored: StoredPlan, exceptProposal: number | null) {
  const { plan } = stored;
  const pendingMoves = plan.moves.filter((_, index) => !accepted(stored, "move", index));
  const moving = new Set(pendingMoves.map((move) => move.session.id));
  const bookings: Bookings = new Map();
  const labels = new Map<string, string>();
  for (const session of input.sessions.filter((item) => !moving.has(item.id))) {
    const key = `session:${session.id}`;
    book(bookings, session.trainerId, booking(key, session.startsAt, session.endsAt, session.timeZone, placeOf(session, input.portZones)));
    labels.set(key, `${session.ship}, ${describeSession(session)}`);
  }
  for (const [index, move] of pendingMoves.entries()) {
    const key = `move:${index}`;
    book(bookings, move.to.trainerId, booking(key, move.to.startsAt, move.to.endsAt, move.to.timeZone, move.to.place));
    labels.set(key, `${move.session.ship} (suggested move), ${describeSession(move.to)}`);
  }
  plan.proposals.forEach((proposal, index) => {
    if (index === exceptProposal || accepted(stored, "proposal", index)) return;
    const key = `proposal:${index}`;
    book(bookings, proposal.trainerId, booking(key, proposal.startsAt, proposal.endsAt, proposal.timeZone, proposal.place));
    labels.set(key, `${proposal.sailing.ship} (proposed), ${describeSession(proposal)}`);
  });
  return { bookings, labels };
}

const monthName = (day: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.parse(`${day}T12:00:00Z`));

/**
 * Checks an admin's change to a proposed session. Errors are what saving the
 * session would refuse (or cannot work out); the planner's own rules (travel
 * time, monthly limit, joining cruises, cruise length, time in port) are
 * warnings, since the admin may know better.
 */
export function checkEdit(input: PlanInput, stored: StoredPlan, index: number, change: Change): EditCheck {
  const original = stored.plan.proposals[index];
  if (!original) return { error: "This proposal is no longer in the plan. Refresh the page." };
  const sailing = input.sailings.find((item) => item.id === change.cruise && item.ship === original.sailing.ship);
  if (!sailing) return { error: "Choose one of this ship's cruises in the plan's dates." };
  const ineligible = ineligibleReason(sailing, input.portZones);
  if (ineligible) return { error: `This cruise cannot be planned: ${ineligible}.` };
  const trainer = input.trainers.find((item) => item.id === change.trainer);
  if (!trainer) return { error: "Choose a trainer." };

  const { bookings, labels } = planBookings(input, stored, index);
  const zone = input.portZones[sailing.startPort ?? ""];
  let startTime: string | null = null;
  if (change.type === "online") {
    if (change.startTime && !isTime(change.startTime)) return { error: "Enter the start time as HH:MM, for example 09:00." };
    startTime = change.startTime || onlineStart(sailing, zone, input.settings.onlineHours, trainer.id, bookings);
    if (!startTime) return { error: `${trainer.name} has no free time for an online session while the ship is in port. Enter a start time.` };
  }
  const slot = buildSlot(sailing, trainer, change.type, startTime, input);
  if ("message" in slot) return { error: slot.message };
  const start = Date.parse(slot.startsAt);
  const end = Date.parse(slot.endsAt);
  if (start < Date.parse(input.settings.now)) return { error: "This session would start in the past." };
  const clashing = clash(bookings, trainer.id, start, end);
  if (clashing) return { error: `${trainer.name} already has training then: ${labels.get(clashing.key) ?? "another session"}.` };

  const warnings: string[] = [];
  const departs = zonedTime(dayOf(sailing.startDate), sailing.departure!, zone).getTime();
  if (change.type === "online" && (startTime! < sailing.arrival! || end > departs)) {
    warnings.push(`Outside the ship's time in port (${sailing.arrival}–${sailing.departure}).`);
  }
  if (change.type === "onboarding") {
    if (!trainer.canJoinCruises) warnings.push(`${trainer.name} is not set to join cruises.`);
    const nights = cruiseNights(sailing);
    if (nights !== null && nights > input.settings.maxOnboardingNights) {
      warnings.push(`The cruise is ${nights} nights, longer than the plan's ${input.settings.maxOnboardingNights}.`);
    }
  }
  const tooClose = slot.place && travelClash(bookings, trainer.id, start, end, slot.place);
  if (tooClose) {
    const other = tooClose.place!;
    const hours = travelGap({ port: other.endPort, zone: other.endZone }, { port: slot.place!.startPort, zone: slot.place!.startZone }) / 3_600_000;
    warnings.push(`Less than ${hours} hours to travel to or from ${labels.get(tooClose.key) ?? "another session"}.`);
  }
  const days = trainingDays(slot.startsAt, slot.endsAt, slot.timeZone);
  if (!withinMonthlyLimit(bookings, trainer, days)) {
    warnings.push(`Over ${trainer.name}'s limit of ${trainer.maxDaysPerMonth} training days in ${monthName(days[0])}.`);
  }
  warnings.push(...ruleViolations(slot, trainer, input.settings.rules).map((rule) => `Breaks the plan's rule: ${rule}`));
  return { slot, warnings };
}

/** The plan with the edited proposal in place, its outcome cleared, and the summary recalculated. */
export function applyEdit(input: PlanInput, stored: StoredPlan, index: number, slot: Slot): StoredPlan {
  const trainer = input.trainers.find((item) => item.id === slot.trainerId)!;
  const edited: Proposal = { ...slot, reason: reasonFor(slot, trainer, "edited by an admin") };
  const proposals = stored.plan.proposals.map((proposal, position) => (position === index ? edited : proposal));
  const proposalStatus = { ...stored.proposalStatus };
  delete proposalStatus[index];
  const next = { ...stored, plan: { ...stored.plan, proposals }, proposalStatus };
  const { bookings } = planBookings(input, { ...next, proposalStatus: {} }, null);
  const summary = summarize(proposals, stored.plan.summary.shipsEligible, input.trainers, bookings, stored.settings);
  return { ...next, plan: { ...next.plan, summary } };
}
