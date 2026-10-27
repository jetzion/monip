/** Cruise details as copied onto a session, or as they are now in the schedule. */
export type CruiseDetails = {
  ship?: string | null;
  cruiseLine?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startPort?: string | null;
  arrival?: string | null;
  departure?: string | null;
};

const FIELDS: { key: keyof CruiseDetails; label: string; date?: true }[] = [
  { key: "ship", label: "Ship" },
  { key: "cruiseLine", label: "Cruise line" },
  { key: "startDate", label: "Start date", date: true },
  { key: "endDate", label: "End date", date: true },
  { key: "startPort", label: "Start port" },
  { key: "arrival", label: "Arrival" },
  { key: "departure", label: "Departure" },
];

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export const CRUISE_REMOVED = "The cruise is no longer in the Cruise Fleet Schedule.";

/**
 * What changed in the cruise since the session was saved, e.g.
 * "Departure: 17:00 → 18:00". Empty when nothing changed.
 */
export function cruiseChanges(copy: CruiseDetails | null | undefined, live: CruiseDetails | null): string[] {
  if (!live) return [CRUISE_REMOVED];
  if (!copy) return [];
  return FIELDS.flatMap(({ key, label, date }) => {
    const before = copy[key] || "";
    const after = live[key] || "";
    const show = (value: string) => (!value ? "none" : date ? dayLabel(value) : value);
    const same = date ? before.slice(0, 10) === after.slice(0, 10) : before === after;
    return same ? [] : [`${label}: ${show(before)} → ${show(after)}`];
  });
}
