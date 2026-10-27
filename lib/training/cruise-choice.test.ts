import { describe, expect, it } from "vitest";

import { changeChoice, cruiseDatesLabel, cruiseDatesUrl, cruiseLinesOf, noChoice, portsOf, shipsOf, type CruiseCombo } from "./cruise-choice";

const combos: CruiseCombo[] = [
  { cruiseLine: "Carnival", ship: "Carnival Conquest", port: "Miami, Florida" },
  { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Miami, Florida" },
  { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Port Canaveral, Florida" },
  { cruiseLine: "Norwegian", ship: "Norwegian Joy", port: "Miami, Florida" },
];

describe("options", () => {
  it("narrows ships to the line and ports to the ship", () => {
    expect(cruiseLinesOf(combos)).toEqual(["Carnival", "Norwegian"]);
    expect(shipsOf(combos, "Carnival")).toEqual(["Carnival Conquest", "Carnival Glory"]);
    expect(shipsOf(combos, "")).toHaveLength(3);
    expect(portsOf(combos, { ...noChoice, ship: "Carnival Glory" })).toEqual(["Miami, Florida", "Port Canaveral, Florida"]);
    expect(portsOf(combos, { ...noChoice, cruiseLine: "Norwegian" })).toEqual(["Miami, Florida"]);
  });
});

describe("changeChoice", () => {
  it("sets the line and a single port from the ship", () => {
    expect(changeChoice(combos, noChoice, "ship", "Norwegian Joy")).toEqual({
      cruiseLine: "Norwegian",
      ship: "Norwegian Joy",
      port: "Miami, Florida",
    });
    expect(changeChoice(combos, noChoice, "ship", "Carnival Glory")).toEqual({ cruiseLine: "Carnival", ship: "Carnival Glory", port: "" });
  });

  it("keeps a port the new ship also uses", () => {
    const glory = { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Miami, Florida" };
    expect(changeChoice(combos, glory, "ship", "Carnival Conquest").port).toBe("Miami, Florida");
  });

  it("clears choices that no longer fit", () => {
    const joy = { cruiseLine: "Norwegian", ship: "Norwegian Joy", port: "Miami, Florida" };
    expect(changeChoice(combos, joy, "cruiseLine", "Carnival")).toEqual({ cruiseLine: "Carnival", ship: "", port: "" });
    expect(changeChoice(combos, joy, "cruiseLine", "")).toEqual(noChoice);
    expect(changeChoice(combos, joy, "ship", "")).toEqual({ cruiseLine: "Norwegian", ship: "", port: "" });
    expect(changeChoice(combos, joy, "port", "")).toEqual({ ...joy, port: "" });
  });
});

describe("cruise dates", () => {
  it("queries the ship's upcoming sailings from the port", () => {
    const url = new URL(cruiseDatesUrl({ cruiseLine: "Norwegian", ship: "Norwegian Joy", port: "Miami, Florida" }, "2026-10-27"), "http://x");
    expect(url.pathname).toBe("/api/cruise-sailings");
    expect(url.searchParams.get("where[and][0][ship][equals]")).toBe("Norwegian Joy");
    expect(url.searchParams.get("where[and][1][startPort][equals]")).toBe("Miami, Florida");
    expect(url.searchParams.get("where[and][2][startDate][greater_than_equal]")).toBe("2026-10-27T00:00:00.000Z");
  });

  it("labels dates with times when known", () => {
    const cruise = { id: 1, ship: "Norwegian Joy", cruiseLine: "Norwegian", startDate: "2026-10-27T12:00:00.000Z", endDate: "2026-11-01T12:00:00.000Z" };
    expect(cruiseDatesLabel({ ...cruise, arrival: "07:30", departure: "17:00" })).toBe("27 Oct – 1 Nov 2026 · 07:30–17:00");
    expect(cruiseDatesLabel({ ...cruise, arrival: "" })).toBe("27 Oct – 1 Nov 2026");
    expect(cruiseDatesLabel({ ...cruise, endDate: "2027-01-03T12:00:00.000Z" })).toBe("27 Oct 2026 – 3 Jan 2027");
    expect(cruiseDatesLabel({ ...cruise, endDate: null })).toBe("27 Oct 2026");
  });
});
