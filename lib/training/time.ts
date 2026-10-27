/** Calendar days are "YYYY-MM-DD"; times of day are "HH:MM" (24-hour). */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isTime = (value: unknown): value is string => typeof value === "string" && TIME.test(value);

/** True for IANA time zone names such as "America/New_York", including aliases. */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The calendar day of a Payload day-only date (stored at 12:00 UTC). */
export const dayOf = (iso: string) => iso.slice(0, 10);

/** Adds whole days to a calendar day. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dayOf(date.toISOString());
}

/** Milliseconds the zone is ahead of UTC at the given instant. */
function offset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return local - Math.floor(instant / 1000) * 1000;
}

const HOURS_12 = 12 * 60 * 60 * 1000;

/**
 * The instant a wall-clock day and time occur in a time zone. A repeated time
 * (clocks go back) resolves to its first occurrence; a skipped time (clocks go
 * forward) resolves to the moment after the gap.
 */
export function zonedTime(day: string, time: string, timeZone: string): Date {
  const wall = Date.UTC(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7)) - 1,
    Number(day.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
  );
  const before = offset(wall - HOURS_12, timeZone);
  const after = offset(wall + HOURS_12, timeZone);
  const matches = [before, after].map((o) => wall - o).filter((t) => wall - offset(t, timeZone) === t);
  return new Date(matches.length ? Math.min(...matches) : wall - before);
}
