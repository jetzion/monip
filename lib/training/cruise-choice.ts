import type { CruiseOption } from "./form";

/** One cruise line, ship, and start port that has upcoming sailings. */
export type CruiseCombo = { cruiseLine: string; ship: string; port: string };

/** The Cruise line, Ship, and Port dropdowns; "" means not chosen. */
export type CruiseChoice = { cruiseLine: string; ship: string; port: string };

export const noChoice: CruiseChoice = { cruiseLine: "", ship: "", port: "" };

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

export const cruiseLinesOf = (combos: CruiseCombo[]) => unique(combos.map((combo) => combo.cruiseLine));

/** Ships of the chosen cruise line, or every ship. */
export const shipsOf = (combos: CruiseCombo[], cruiseLine: string) =>
  unique(combos.filter((combo) => !cruiseLine || combo.cruiseLine === cruiseLine).map((combo) => combo.ship));

/** Start ports of the chosen ship, or of the chosen cruise line, or every port. */
export const portsOf = (combos: CruiseCombo[], choice: CruiseChoice) =>
  unique(
    combos
      .filter((combo) => (!choice.ship || combo.ship === choice.ship) && (!choice.cruiseLine || combo.cruiseLine === choice.cruiseLine))
      .map((combo) => combo.port),
  );

/**
 * Applies one dropdown change. Choosing a ship sets its cruise line, and its
 * port when it sails from only one; later choices that no longer fit are cleared.
 */
export function changeChoice(combos: CruiseCombo[], choice: CruiseChoice, field: keyof CruiseChoice, value: string): CruiseChoice {
  if (field === "cruiseLine") {
    const keepShip = value && shipsOf(combos, value).includes(choice.ship);
    return keepShip ? { ...choice, cruiseLine: value } : { cruiseLine: value, ship: "", port: "" };
  }
  if (field === "ship") {
    if (!value) return { ...choice, ship: "", port: "" };
    const cruiseLine = combos.find((combo) => combo.ship === value)?.cruiseLine ?? choice.cruiseLine;
    const ports = portsOf(combos, { cruiseLine, ship: value, port: "" });
    const port = ports.length === 1 ? ports[0] : ports.includes(choice.port) ? choice.port : "";
    return { cruiseLine, ship: value, port };
  }
  return { ...choice, port: value };
}

/** REST URL for a ship's sailings from a port, starting on or after a day. */
export function cruiseDatesUrl(choice: CruiseChoice, fromDay: string): string {
  const params = new URLSearchParams({ limit: "200", depth: "0", sort: "startDate" });
  params.set("where[and][0][ship][equals]", choice.ship);
  params.set("where[and][1][startPort][equals]", choice.port);
  params.set("where[and][2][startDate][greater_than_equal]", `${fromDay}T00:00:00.000Z`);
  for (const field of ["ship", "cruiseLine", "startDate", "endDate", "startPort", "arrival", "departure"]) {
    params.set(`select[${field}]`, "true");
  }
  return `/api/cruise-sailings?${params}`;
}

const day = (iso: string, withYear = true) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(
    new Date(iso),
  );

/** "27 Oct – 1 Nov 2026 · 07:30–17:00": the start's year only when it differs; times only when both are known. */
export function cruiseDatesLabel(cruise: CruiseOption): string {
  const { startDate, endDate } = cruise;
  const dates = endDate ? `${day(startDate, startDate.slice(0, 4) !== endDate.slice(0, 4))} – ${day(endDate)}` : day(startDate);
  return cruise.arrival && cruise.departure ? `${dates} · ${cruise.arrival}–${cruise.departure}` : dates;
}
