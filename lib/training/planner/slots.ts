import { type FieldError, isFieldError, sessionTimes, type TrainingType } from "../schedule";
import { dayOf, isTime, zonedTime } from "../time";
import { clash, type Place, trainingDays, travelClash, withinMonthlyLimit, type Bookings } from "./bookings";
import { ruleBonus, ruleViolations } from "./rules";
import type { PlanCosts, PlanSailing, PlanSettings, PlanTrainer, Preset, Slot } from "./types";

/** Why a sailing cannot be planned, or null when it can. */
export function ineligibleReason(sailing: PlanSailing, portZones: Record<string, string>): string | null {
  if (!isTime(sailing.arrival) || !isTime(sailing.departure)) return "no arrival and departure times";
  if (sailing.departure <= sailing.arrival) return "departure is not after arrival";
  if (!portZones[sailing.startPort ?? ""]) return `no time zone for ${sailing.startPort ?? "its start port"}`;
  return null;
}

/** How much each preset values each format (higher is better). */
const FORMAT_VALUE: Record<Preset, Record<TrainingType, number>> = {
  balanced: { departureDay: 3, onboarding: 2, online: 1 },
  lowerCost: { online: 3, departureDay: 2, onboarding: 0 },
  moreInPerson: { onboarding: 4, departureDay: 3, online: 0 },
};

/**
 * Score lost per trip away from home base; a night counts a third of a trip.
 * Balanced keeps in-person with travel (3 - 1.33) ahead of online (1);
 * Lower cost does not (2 - 4).
 */
const TRAVEL_PENALTY: Record<Preset, number> = { balanced: 1, lowerCost: 3, moreInPerson: 0.5 };

function estimate(type: TrainingType, days: number, trips: number, nights: number, costs: PlanCosts): number | null {
  const base = { online: costs.onlineSession, departureDay: costs.departureDaySession, onboarding: costs.onboardingDay }[type];
  const parts = [type === "onboarding" && base !== null ? base * days : base];
  if (trips) parts.push(costs.trip === null ? null : costs.trip * trips);
  if (nights) parts.push(costs.night === null ? null : costs.night * nights);
  return parts.some((part) => part === null) ? null : parts.reduce<number>((sum, part) => sum + (part ?? 0), 0);
}

/** Departure day needs the trainer at the port the night before when it is not home. */
function travelFor(type: TrainingType, sailing: PlanSailing, trainer: PlanTrainer) {
  if (type === "online") return { travel: false, trips: 0, nights: 0 };
  const away = (port: string | null) => !trainer.homeBase || port !== trainer.homeBase;
  if (type === "departureDay") {
    const travel = away(sailing.startPort);
    return { travel, trips: travel ? 1 : 0, nights: travel ? 1 : 0 };
  }
  const travel = away(sailing.startPort) || away(sailing.endPort ?? sailing.startPort);
  return { travel, trips: travel ? 1 : 0, nights: 0 };
}

const STEP_MINUTES = 30;
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Earliest free start for an online session inside the in-port window, in 30-minute steps. */
export function onlineStart(sailing: PlanSailing, zone: string, hours: number, trainerId: number, bookings: Bookings) {
  const day = dayOf(sailing.startDate);
  const last = minutesOf(sailing.departure!) - hours * 60;
  for (let minute = minutesOf(sailing.arrival!); minute <= last; minute += STEP_MINUTES) {
    const start = zonedTime(day, hhmm(minute), zone).getTime();
    if (!clash(bookings, trainerId, start, start + hours * 3_600_000)) return hhmm(minute);
  }
  return null;
}

type SlotContext = { settings: PlanSettings; portZones: Record<string, string>; costs: PlanCosts; bookings: Bookings };

/** Nights of a cruise, or null without an end date. */
export const cruiseNights = (sailing: PlanSailing) =>
  sailing.endDate ? (Date.parse(dayOf(sailing.endDate)) - Date.parse(dayOf(sailing.startDate))) / 86_400_000 : null;

/**
 * The session this trainer would give, with its times, place, travel, cost,
 * and score, without checking availability. Online sessions start at
 * `startTime` (local "HH:MM"). A FieldError when the times cannot be worked out.
 */
export function buildSlot(
  sailing: PlanSailing,
  trainer: PlanTrainer,
  type: TrainingType,
  startTime: string | null,
  context: Omit<SlotContext, "bookings">,
): Slot | FieldError {
  const { settings, portZones, costs } = context;
  const zone = portZones[sailing.startPort ?? ""];
  const date = `${dayOf(sailing.startDate)}T12:00:00.000Z`;
  const online = { date, startTime: startTime ?? undefined, timeZone: zone, durationHours: String(settings.onlineHours) as "2" | "4" | "8" };
  const times = sessionTimes({ type, ...(type === "online" ? online : {}) }, sailing, zone);
  if (isFieldError(times)) return times;
  const endPort = type === "onboarding" ? (sailing.endPort ?? sailing.startPort) : sailing.startPort;
  const place: Place | null =
    type === "online" ? null : { startPort: sailing.startPort, endPort, startZone: zone, endZone: portZones[endPort ?? ""] ?? null };
  const days = trainingDays(times.startsAt, times.endsAt, times.timeZone);
  const { travel, trips, nights } = travelFor(type, sailing, trainer);
  const cost = estimate(type, days.length, trips, nights, costs);
  const penalty = TRAVEL_PENALTY[settings.preset] * (trips + nights / 3);
  // Known costs break ties: cheaper is slightly better.
  const score = FORMAT_VALUE[settings.preset][type] - penalty - (cost ?? 0) / 1_000_000;
  const slot: Slot = {
    sailing,
    trainerId: trainer.id,
    type,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    timeZone: times.timeZone,
    fields: { cruise: sailing.id, trainer: trainer.id, type, ...(type === "online" ? online : {}) },
    place,
    travel,
    trips,
    nights,
    cost,
    score,
  };
  return { ...slot, score: score + ruleBonus(slot, settings.rules) };
}

/**
 * The slot where this trainer could give this type of training on this
 * sailing, or null when it is not possible (busy, too little time to travel,
 * over the monthly limit, cannot join cruises, cruise too long, or in the past).
 */
export function slotFor(sailing: PlanSailing, trainer: PlanTrainer, type: TrainingType, context: SlotContext): Slot | null {
  const { settings, portZones, bookings } = context;
  if (type === "onboarding") {
    const nights = cruiseNights(sailing);
    if (!trainer.canJoinCruises || nights === null || nights > settings.maxOnboardingNights) return null;
  }
  const zone = portZones[sailing.startPort ?? ""];
  const startTime = type === "online" ? onlineStart(sailing, zone, settings.onlineHours, trainer.id, bookings) : null;
  if (type === "online" && !startTime) return null;
  const slot = buildSlot(sailing, trainer, type, startTime, context);
  if ("message" in slot) return null;
  const start = Date.parse(slot.startsAt);
  const end = Date.parse(slot.endsAt);
  if (start < Date.parse(settings.now) || clash(bookings, trainer.id, start, end)) return null;
  if (slot.place && travelClash(bookings, trainer.id, start, end, slot.place)) return null;
  if (!withinMonthlyLimit(bookings, trainer, trainingDays(slot.startsAt, slot.endsAt, slot.timeZone))) return null;
  if (ruleViolations(slot, trainer, settings.rules).length) return null;
  return slot;
}
