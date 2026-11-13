import type { PlanTrainer } from "./types";

/** Where an in-person session starts and ends (onboarding may end elsewhere); null for online. */
export type Place = { startPort: string | null; endPort: string | null; startZone: string | null; endZone: string | null };

/** Time a trainer is busy; `key` identifies the session or proposal. */
export type Booking = { key: string; startsAt: number; endsAt: number; days: string[]; place: Place | null };

/** Every trainer's bookings, by trainer id. */
export type Bookings = Map<number, Booking[]>;

const localDay = (instant: number, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);

/** Calendar days a session covers in its own time zone (onboarding ends at midnight after its last day). */
export function trainingDays(startsAt: string, endsAt: string, timeZone: string): string[] {
  const first = localDay(Date.parse(startsAt), timeZone);
  const last = localDay(Date.parse(endsAt) - 1, timeZone);
  const days: string[] = [];
  for (let day = first; day <= last; ) {
    days.push(day);
    const next = new Date(`${day}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    day = next.toISOString().slice(0, 10);
  }
  return days;
}

export function booking(key: string, startsAt: string, endsAt: string, timeZone: string, place: Place | null = null): Booking {
  return { key, startsAt: Date.parse(startsAt), endsAt: Date.parse(endsAt), days: trainingDays(startsAt, endsAt, timeZone), place };
}

const HOUR = 3_600_000;

/**
 * Time needed between in-person sessions to change port, without real travel
 * data: overnight (12 h) within a time zone, a full travel day (36 h) between
 * time zones or when a zone is unknown.
 */
export function travelGap(from: { port: string | null; zone: string | null }, to: { port: string | null; zone: string | null }) {
  if (from.port && from.port === to.port) return 0;
  return from.zone && from.zone === to.zone ? 12 * HOUR : 36 * HOUR;
}

/** An in-person booking too close to reach from, or to get to, this place in time. */
export function travelClash(bookings: Bookings, trainerId: number, startsAt: number, endsAt: number, place: Place) {
  return bookings.get(trainerId)?.find((other) => {
    if (!other.place) return false;
    if (other.endsAt <= startsAt) {
      const gap = travelGap({ port: other.place.endPort, zone: other.place.endZone }, { port: place.startPort, zone: place.startZone });
      return startsAt - other.endsAt < gap;
    }
    if (other.startsAt >= endsAt) {
      const gap = travelGap({ port: place.endPort, zone: place.endZone }, { port: other.place.startPort, zone: other.place.startZone });
      return other.startsAt - endsAt < gap;
    }
    return false;
  });
}

/** The booking that overlaps the time, if any; back-to-back is allowed, as in the Training Schedule. */
export function clash(bookings: Bookings, trainerId: number, startsAt: number, endsAt: number) {
  return bookings.get(trainerId)?.find((other) => startsAt < other.endsAt && endsAt > other.startsAt);
}

/** True when adding these days keeps the trainer within their monthly limit in every month touched. */
export function withinMonthlyLimit(bookings: Bookings, trainer: PlanTrainer, days: string[]) {
  if (!trainer.maxDaysPerMonth) return true;
  const booked = new Set((bookings.get(trainer.id) ?? []).flatMap((entry) => entry.days));
  for (const month of new Set(days.map((day) => day.slice(0, 7)))) {
    const used = new Set([...booked, ...days].filter((day) => day.startsWith(month)));
    if (used.size > trainer.maxDaysPerMonth) return false;
  }
  return true;
}

export function book(bookings: Bookings, trainerId: number, entry: Booking) {
  bookings.set(trainerId, [...(bookings.get(trainerId) ?? []), entry]);
}

export function unbook(bookings: Bookings, trainerId: number, key: string) {
  bookings.set(trainerId, (bookings.get(trainerId) ?? []).filter((entry) => entry.key !== key));
}

/** Training days per trainer per month ("YYYY-MM"). */
export function daysByMonth(bookings: Bookings, trainerId: number): Map<string, number> {
  const days = new Set((bookings.get(trainerId) ?? []).flatMap((entry) => entry.days));
  const months = new Map<string, number>();
  for (const day of days) months.set(day.slice(0, 7), (months.get(day.slice(0, 7)) ?? 0) + 1);
  return months;
}
