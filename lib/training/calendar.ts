import { addDays } from "./time";
import type { TrainingType } from "./schedule";

/** A session as the calendar shows it. */
export type CalendarSession = {
  id: number;
  type: TrainingType;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  trainer: string;
  ship: string;
  /** The cruise changed or was removed since the session was saved. */
  needsReview?: boolean;
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The "YYYY-MM" month from the URL, or the month of `today`. */
export const monthOf = (param: string | undefined, today: string) => (param && MONTH.test(param) ? param : today.slice(0, 7));

/** Moves a "YYYY-MM" month by whole months. */
export function shiftMonth(month: string, months: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 7);
}

/** "October 2026". */
export const monthTitle = (month: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));

/** Days of the weeks (Monday first) that cover the month. */
export function monthGrid(month: string): string[] {
  const first = `${month}-01`;
  const weekday = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -weekday);
  const last = addDays(`${shiftMonth(month, 1)}-01`, -1);
  const days: string[] = [];
  for (let day = start; day <= last || days.length % 7 !== 0; day = addDays(day, 1)) days.push(day);
  return days;
}

/** The calendar day of an instant in a time zone. */
export const localDay = (iso: string | number, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** First and last day a session covers in its own time zone (its end is exclusive). */
export const sessionDays = (session: CalendarSession) => ({
  first: localDay(session.startsAt, session.timeZone),
  last: localDay(Date.parse(session.endsAt) - 1, session.timeZone),
});

/** Sessions on each grid day, earliest first; multi-day sessions appear on every day they cover. */
export function placeSessions(sessions: CalendarSession[], days: string[]): Map<string, CalendarSession[]> {
  const byDay = new Map<string, CalendarSession[]>(days.map((day) => [day, []]));
  const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const session of sorted) {
    const { first, last } = sessionDays(session);
    for (const day of days) if (day >= first && day <= last) byDay.get(day)!.push(session);
  }
  return byDay;
}

/** Start time in the session's zone, e.g. "08:00"; onboarding runs all day. */
export const startLabel = (session: CalendarSession) =>
  session.type === "onboarding"
    ? "All day"
    : new Intl.DateTimeFormat("en-GB", { timeZone: session.timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
        new Date(session.startsAt),
      );

/** Range of instants to query so every session touching the grid is found, whatever its zone. */
export const gridRange = (days: string[]) => ({
  from: `${addDays(days[0], -1)}T00:00:00.000Z`,
  to: `${addDays(days[days.length - 1], 2)}T00:00:00.000Z`,
});

/** URL parameters the Training Schedule page reads. */
export const CALENDAR_PARAMS = ["calMonth", "calTrainer", "calCruise", "calType", "calSession"] as const;
export type CalendarParams = Partial<Record<(typeof CALENDAR_PARAMS)[number], string>>;

/** Reads the calendar's parameters from a page's search params. */
export function readParams(searchParams: Record<string, string | string[] | undefined> | undefined): CalendarParams {
  const params: CalendarParams = {};
  for (const key of CALENDAR_PARAMS) {
    const value = searchParams?.[key];
    if (typeof value === "string" && value) params[key] = value;
  }
  return params;
}

/** A query string with some parameters changed; undefined removes one. */
export function calendarHref(params: CalendarParams, changes: CalendarParams): string {
  const merged = { ...params, ...changes };
  const query = new URLSearchParams();
  for (const key of CALENDAR_PARAMS) if (merged[key]) query.set(key, merged[key]!);
  const text = query.toString();
  return text ? `?${text}` : "?";
}
