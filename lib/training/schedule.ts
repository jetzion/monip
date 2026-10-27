import { addDays, dayOf, isTime, isTimeZone, zonedTime } from "./time";

export const TRAINING_TYPES = [
  { label: "Online training", value: "online" },
  { label: "Departure day training", value: "departureDay" },
  { label: "Onboarding training", value: "onboarding" },
] as const;

export type TrainingType = (typeof TRAINING_TYPES)[number]["value"];

export const DURATIONS = ["2", "4", "8"] as const;

/** The cruise fields that set a session's date and times. */
export type CruiseTimes = {
  startDate: string;
  endDate?: string | null;
  startPort?: string | null;
  arrival?: string | null;
  departure?: string | null;
};

/** What the admin enters; which fields apply depends on the type. */
export type SessionInput = {
  type: TrainingType;
  date?: string | null;
  startTime?: string | null;
  timeZone?: string | null;
  durationHours?: string | null;
  endDate?: string | null;
};

export type SessionTimes = {
  date: string;
  endDate: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
};

export type FieldError = { path: string; message: string };

const noon = (day: string) => `${day}T12:00:00.000Z`;

const iso = (day: string, time: string, timeZone: string) => zonedTime(day, time, timeZone).toISOString();

const missingZone = (port: string | null | undefined): FieldError => ({
  path: "cruise",
  message: `No time zone for start port "${port ?? "unknown"}". Add it under Port time zones.`,
});

function online(input: SessionInput): SessionTimes | FieldError {
  const { date, startTime, timeZone, durationHours } = input;
  if (!date) return { path: "date", message: "Choose a date." };
  if (!isTime(startTime)) return { path: "startTime", message: "Enter the start time as HH:MM, for example 09:00." };
  if (!isTimeZone(timeZone)) return { path: "timeZone", message: "Choose a time zone." };
  if (!DURATIONS.includes(durationHours as (typeof DURATIONS)[number])) {
    return { path: "durationHours", message: "Choose 2, 4, or 8 hours." };
  }
  const start = zonedTime(dayOf(date), startTime, timeZone);
  const end = new Date(start.getTime() + Number(durationHours) * 60 * 60 * 1000);
  return { date: noon(dayOf(date)), endDate: null, startsAt: start.toISOString(), endsAt: end.toISOString(), timeZone };
}

function departureDay(cruise: CruiseTimes, portZone: string | null): SessionTimes | FieldError {
  const { arrival, departure } = cruise;
  if (!isTime(arrival) || !isTime(departure)) {
    return {
      path: "cruise",
      message: "This cruise has no arrival and departure times, so departure-day training is not available.",
    };
  }
  if (!portZone) return missingZone(cruise.startPort);
  if (departure <= arrival) return { path: "cruise", message: "This cruise's departure time is not after its arrival time." };
  const day = dayOf(cruise.startDate);
  return {
    date: noon(day),
    endDate: null,
    startsAt: iso(day, arrival, portZone),
    endsAt: iso(day, departure, portZone),
    timeZone: portZone,
  };
}

function onboarding(input: SessionInput, cruise: CruiseTimes, portZone: string | null): SessionTimes | FieldError {
  if (!portZone) return missingZone(cruise.startPort);
  const start = dayOf(cruise.startDate);
  const endSource = input.endDate ?? cruise.endDate;
  if (!endSource) return { path: "endDate", message: "Choose an end date." };
  const end = dayOf(endSource);
  if (end < start) return { path: "endDate", message: `The end date must be on or after the start date (${start}).` };
  return {
    date: noon(start),
    endDate: noon(end),
    startsAt: iso(start, "00:00", portZone),
    endsAt: iso(addDays(end, 1), "00:00", portZone),
    timeZone: portZone,
  };
}

/**
 * Works out when a session runs. Online sessions use the admin's date, time,
 * zone, and duration; departure-day and onboarding sessions use the cruise and
 * its start port's time zone. Onboarding blocks whole days.
 */
export function sessionTimes(input: SessionInput, cruise: CruiseTimes, portZone: string | null): SessionTimes | FieldError {
  if (input.type === "online") return online(input);
  if (input.type === "departureDay") return departureDay(cruise, portZone);
  return onboarding(input, cruise, portZone);
}

export const isFieldError = (value: SessionTimes | FieldError): value is FieldError => "message" in value;

/** "Online training, 27 Oct 2026 09:00 – 13:00 (America/New_York)" style text. */
export function describeSession(session: { type: TrainingType; startsAt: string; endsAt: string; timeZone: string }) {
  const { type, timeZone } = session;
  const label = TRAINING_TYPES.find((option) => option.value === type)?.label ?? type;
  const day = { day: "numeric", month: "short", year: "numeric" } as const;
  const time = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as const;
  const format = (instant: number, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(instant);
  const start = Date.parse(session.startsAt);
  const end = Date.parse(session.endsAt);
  // Onboarding ends at midnight after its last day.
  const range =
    type === "onboarding"
      ? `${format(start, day)} – ${format(end - 1, day)}`
      : `${format(start, { ...day, ...time })} – ${format(end, time)}`;
  return `${label}, ${range} (${timeZone})`;
}
