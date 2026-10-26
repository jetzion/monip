import type { Where } from "payload";

/** Selected Cruise Fleet Schedule filters; unset means "All". */
export type SailingFilters = {
  port?: string;
  month?: string; // YYYY-MM
  date?: string; // YYYY-MM-DD
  cruiseLine?: string;
  operator?: string;
  ship?: string;
};

const TEXT_FILTERS = [
  ["port", "startPort"],
  ["cruiseLine", "cruiseLine"],
  ["operator", "operator"],
  ["ship", "ship"],
] as const;

const nextMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 1)).toISOString().slice(0, 7);
};

/**
 * Builds a Payload where query that matches every selected filter (AND),
 * in the { or: [{ and }] } shape the admin's own filter controls use.
 * Start dates are stored at 12:00 UTC, so a date matches exactly.
 */
export const filtersToWhere = (filters: SailingFilters): Where => {
  const and: Where[] = [];
  for (const [key, field] of TEXT_FILTERS) {
    if (filters[key]) and.push({ [field]: { equals: filters[key] } });
  }
  if (filters.month) {
    and.push({ startDate: { greater_than_equal: `${filters.month}-01T00:00:00.000Z` } });
    and.push({ startDate: { less_than: `${nextMonth(filters.month)}-01T00:00:00.000Z` } });
  }
  if (filters.date) and.push({ startDate: { equals: `${filters.date}T12:00:00.000Z` } });
  return and.length > 0 ? { or: [{ and }] } : {};
};

/** Ship options: the selected cruise line's ships, or every ship when none is selected. */
export const shipsFor = (
  cruiseLine: string | undefined,
  options: { ships: string[]; shipsByCruiseLine: Record<string, string[]> },
): string[] => (cruiseLine ? (options.shipsByCruiseLine[cruiseLine] ?? []) : options.ships);

/**
 * Applies one filter change. Choosing a cruise line clears the selected ship
 * when that ship does not belong to the new cruise line.
 */
export const changeFilter = (
  filters: SailingFilters,
  key: keyof SailingFilters,
  value: string | undefined,
  shipsByCruiseLine: Record<string, string[]>,
): SailingFilters => {
  const next = { ...filters, [key]: value || undefined };
  if (key === "cruiseLine" && next.cruiseLine && next.ship && !shipsByCruiseLine[next.cruiseLine]?.includes(next.ship)) {
    next.ship = undefined;
  }
  return next;
};

/** Reads the selected filters back from a where query built by filtersToWhere. */
export const whereToFilters = (where: Where | undefined): SailingFilters => {
  const conditions = (where?.or?.[0]?.and ?? []) as Record<string, Record<string, unknown>>[];
  const filters: SailingFilters = {};
  for (const condition of conditions) {
    for (const [key, field] of TEXT_FILTERS) {
      if (typeof condition[field]?.equals === "string") filters[key] = condition[field].equals;
    }
    const startDate = condition.startDate;
    if (typeof startDate?.greater_than_equal === "string") filters.month = startDate.greater_than_equal.slice(0, 7);
    if (typeof startDate?.equals === "string") filters.date = startDate.equals.slice(0, 10);
  }
  return filters;
};
