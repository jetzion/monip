import { localDay } from "./calendar";
import { TRAINING_TYPES, type TrainingType } from "./schedule";
import { addDays, dayOf } from "./time";

/** What the admin asks for: one trainer or all, a month range, and a layout. */
export type ReportParams = {
  /** A trainer id, or undefined for all trainers. */
  trainer?: string;
  from: string;
  to: string;
  group: "trainer" | "date";
};

/** A session as the report reads it. */
export type ReportSession = {
  id: number;
  type: TrainingType;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  trainerId: number;
  trainer: string;
  cruiseCopy?: {
    ship?: string | null;
    cruiseLine?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    startPort?: string | null;
  } | null;
};

export type ReportRow = {
  id: number;
  dates: string;
  time: string;
  timeZone: string;
  type: string;
  trainer: string;
  cruiseLine: string;
  ship: string;
  startPort: string;
  cruiseDates: string;
};

export type ReportTotals = { sessions: number; hours: number; days: number };

export type ReportGroup = { heading: string | null; rows: ReportRow[]; totals: ReportTotals };

export type Report = { title: string; range: string; groups: ReportGroup[]; totals: ReportTotals };

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const read = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** The report's parameters from a URL, or an error to show. Months default to the month of `today`. */
export function readReportParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  today: string,
): ReportParams | { error: string } {
  const thisMonth = today.slice(0, 7);
  const from = read(searchParams?.from) || thisMonth;
  const to = read(searchParams?.to) || thisMonth;
  const trainer = read(searchParams?.trainer);
  if (!MONTH.test(from) || !MONTH.test(to)) return { error: "Choose the start and end months." };
  if (to < from) return { error: "The end month must be the same as or after the start month." };
  if (trainer && !/^\d+$/.test(trainer)) return { error: "Choose a trainer from the list." };
  return { trainer: trainer || undefined, from, to, group: read(searchParams?.group) === "date" ? "date" : "trainer" };
}

/** Query string for a report, used by the page and the PDF link. */
export function reportQuery(params: ReportParams): string {
  const query = new URLSearchParams({ from: params.from, to: params.to, group: params.group });
  if (params.trainer) query.set("trainer", params.trainer);
  return query.toString();
}

const firstDay = (month: string) => `${month}-01`;

const lastDay = (month: string) => {
  const next = new Date(`${month}-01T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return addDays(dayOf(next.toISOString()), -1);
};

/** Range of instants to query so every session touching the months is found, whatever its zone. */
export const reportQueryRange = (params: ReportParams) => ({
  from: `${addDays(firstDay(params.from), -1)}T00:00:00.000Z`,
  to: `${addDays(lastDay(params.to), 2)}T00:00:00.000Z`,
});

/** First and last day a session covers in its own time zone (its end is exclusive). */
const daysOf = (session: ReportSession) => ({
  first: localDay(session.startsAt, session.timeZone),
  last: localDay(Date.parse(session.endsAt) - 1, session.timeZone),
});

/** True when any day of the session falls within the report's months. */
export function overlaps(session: ReportSession, params: ReportParams): boolean {
  const { first, last } = daysOf(session);
  return first <= lastDay(params.to) && last >= firstDay(params.from);
}

const DAY = { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" } as const;

/** "27 Oct 2026" for a "YYYY-MM-DD" day. */
const formatDay = (day: string) => new Intl.DateTimeFormat("en-GB", DAY).format(new Date(`${day}T12:00:00Z`));

const dayRange = (first: string, last: string) => (first === last ? formatDay(first) : `${formatDay(first)} – ${formatDay(last)}`);

const clock = (instant: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(instant));

const typeLabel = (type: TrainingType) => TRAINING_TYPES.find((option) => option.value === type)?.label ?? type;

/** One report line: dates and times in the session's own time zone, plus its cruise. */
export function reportRow(session: ReportSession): ReportRow {
  const { first, last } = daysOf(session);
  const copy = session.cruiseCopy;
  return {
    id: session.id,
    dates: dayRange(first, last),
    time: session.type === "onboarding" ? "All day" : `${clock(session.startsAt, session.timeZone)} – ${clock(session.endsAt, session.timeZone)}`,
    timeZone: session.timeZone,
    type: typeLabel(session.type),
    trainer: session.trainer,
    cruiseLine: copy?.cruiseLine || "—",
    ship: copy?.ship || "—",
    startPort: copy?.startPort || "—",
    cruiseDates: copy?.startDate ? dayRange(dayOf(copy.startDate), dayOf(copy.endDate ?? copy.startDate)) : "—",
  };
}

const HOUR = 60 * 60 * 1000;

/** Sessions, hours of timed training, and days of onboarding; whole sessions count. */
export function totalsOf(sessions: ReportSession[]): ReportTotals {
  const totals = { sessions: sessions.length, hours: 0, days: 0 };
  for (const session of sessions) {
    if (session.type === "onboarding") {
      const { first, last } = daysOf(session);
      totals.days += Math.round((Date.parse(last) - Date.parse(first)) / (24 * HOUR)) + 1;
    } else {
      totals.hours += (Date.parse(session.endsAt) - Date.parse(session.startsAt)) / HOUR;
    }
  }
  return totals;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** "3 sessions · 6 hours · 4 days of onboarding", leaving out zero hours or days. */
export const totalsLabel = (totals: ReportTotals) =>
  [
    plural(totals.sessions, "session"),
    totals.hours ? plural(Math.round(totals.hours * 100) / 100, "hour") : "",
    totals.days ? `${plural(totals.days, "day")} of onboarding` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const monthName = (month: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));

/** "October 2026" or "October 2026 – January 2027". */
export const rangeLabel = (params: ReportParams) =>
  params.from === params.to ? monthName(params.from) : `${monthName(params.from)} – ${monthName(params.to)}`;

/**
 * The report for sessions already narrowed to the trainer. Keeps sessions with
 * any day in the months, earliest first, either one section per trainer (in
 * `trainerOrder`) or a single list by date.
 */
export function buildReport(sessions: ReportSession[], params: ReportParams, trainerOrder: number[], trainerName?: string): Report {
  const kept = sessions.filter((session) => overlaps(session, params)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const title = trainerName ? `Training report: ${trainerName}` : "Training report: all trainers";
  const group = (heading: string | null, list: ReportSession[]): ReportGroup => ({ heading, rows: list.map(reportRow), totals: totalsOf(list) });

  if (params.group === "date") return { title, range: rangeLabel(params), groups: [group(null, kept)], totals: totalsOf(kept) };

  const rank = new Map(trainerOrder.map((id, index) => [id, index]));
  const byTrainer = new Map<number, ReportSession[]>();
  for (const session of kept) byTrainer.set(session.trainerId, [...(byTrainer.get(session.trainerId) ?? []), session]);
  const groups = [...byTrainer]
    .sort(([a], [b]) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity))
    .map(([, list]) => group(list[0].trainer, list));
  return { title, range: rangeLabel(params), groups, totals: totalsOf(kept) };
}

/** Months from January two years before `today` to December two years after, widened to include `chosen`. */
export function monthOptions(today: string, chosen: string[]): { label: string; value: string }[] {
  const years = [Number(today.slice(0, 4)) - 2, Number(today.slice(0, 4)) + 2, ...chosen.filter((month) => MONTH.test(month)).map((month) => Number(month.slice(0, 4)))];
  const options = [];
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    for (let month = 1; month <= 12; month++) {
      const value = `${year}-${String(month).padStart(2, "0")}`;
      options.push({ label: monthName(value), value });
    }
  }
  return options;
}
