import type { Payload, TypedUser, Where } from "payload";

export type MonthOption = { value: string; label: string };

/**
 * Dropdown options for the Cruise Fleet Schedule, from the complete dataset.
 * shipsByCruiseLine narrows the Ship dropdown once a cruise line is chosen.
 */
export type SailingFilterOptions = {
  ports: string[];
  months: MonthOption[];
  cruiseLines: string[];
  operators: string[];
  ships: string[];
  shipsByCruiseLine: Record<string, string[]>;
};

const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Distinct YYYY-MM months of the given ISO dates, oldest first, labelled like "October 2026". */
export const monthOptions = (isoDates: string[]): MonthOption[] =>
  [...new Set(isoDates.map((date) => date.slice(0, 7)))]
    .sort()
    .map((value) => ({ value, label: monthLabel.format(new Date(`${value}-01T12:00:00Z`)) }));

type DistinctField = "startPort" | "cruiseLine" | "operator" | "ship" | "startDate";

/** Loads distinct values for every filter, respecting the user's access. */
export async function getSailingFilterOptions(payload: Payload, user: TypedUser | null): Promise<SailingFilterOptions> {
  const distinct = async (field: DistinctField, where?: Where) => {
    const { values } = await payload.findDistinct({
      collection: "cruise-sailings",
      field,
      sort: field,
      where,
      overrideAccess: false,
      user,
    });
    return values.map((row) => row[field]).filter((value): value is string => typeof value === "string" && value !== "");
  };

  const [ports, cruiseLines, operators, ships, startDates] = await Promise.all(
    (["startPort", "cruiseLine", "operator", "ship", "startDate"] as const).map((field) => distinct(field)),
  );
  const shipsPerLine = await Promise.all(
    cruiseLines.map((line) => distinct("ship", { cruiseLine: { equals: line } })),
  );
  const shipsByCruiseLine = Object.fromEntries(cruiseLines.map((line, i) => [line, shipsPerLine[i]]));
  return { ports, months: monthOptions(startDates), cruiseLines, operators, ships, shipsByCruiseLine };
}
