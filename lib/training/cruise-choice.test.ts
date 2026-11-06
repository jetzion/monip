import { describe, expect, it } from "vitest";

import { changeChoice, cruiseDatesLabel, cruiseDatesUrl, noChoice, optionsFor, type CruiseCombo } from "./cruise-choice";

const combos: CruiseCombo[] = [
  { cruiseLine: "Carnival", ship: "Carnival Conquest", port: "Miami, Florida" },
  { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Miami, Florida" },
  { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Port Canaveral, Florida" },
  { cruiseLine: "Norwegian", ship: "Norwegian Joy", port: "Miami, Florida" },
];

describe("optionsFor", () => {
  it("lists everything when nothing is chosen", () => {
    expect(optionsFor(combos, noChoice, "cruiseLine")).toEqual(["Carnival", "Norwegian"]);
    expect(optionsFor(combos, noChoice, "ship")).toHaveLength(3);
    expect(optionsFor(combos, noChoice, "port")).toEqual(["Miami, Florida", "Port Canaveral, Florida"]);
  });

  it("narrows by line and ship, as before", () => {
    expect(optionsFor(combos, { ...noChoice, cruiseLine: "Carnival" }, "ship")).toEqual(["Carnival Conquest", "Carnival Glory"]);
    expect(optionsFor(combos, { ...noChoice, ship: "Carnival Glory" }, "port")).toEqual(["Miami, Florida", "Port Canaveral, Florida"]);
    expect(optionsFor(combos, { ...noChoice, cruiseLine: "Norwegian" }, "port")).toEqual(["Miami, Florida"]);
  });

  it("narrows lines and ships by a port chosen first", () => {
    const miami = { ...noChoice, port: "Miami, Florida" };
    expect(optionsFor(combos, miami, "cruiseLine")).toEqual(["Carnival", "Norwegian"]);
    expect(optionsFor(combos, miami, "ship")).toEqual(["Carnival Conquest", "Carnival Glory", "Norwegian Joy"]);
    const canaveral = { ...noChoice, port: "Port Canaveral, Florida" };
    expect(optionsFor(combos, canaveral, "cruiseLine")).toEqual(["Carnival"]);
    expect(optionsFor(combos, { ...miami, cruiseLine: "Carnival" }, "ship")).toEqual(["Carnival Conquest", "Carnival Glory"]);
  });

  it("ignores the field's own choice so it can be changed", () => {
    const glory = { cruiseLine: "Carnival", ship: "Carnival Glory", port: "Miami, Florida" };
    expect(optionsFor(combos, glory, "port")).toEqual(["Miami, Florida", "Port Canaveral, Florida"]);
    expect(optionsFor(combos, glory, "ship")).toEqual(["Carnival Conquest", "Carnival Glory"]);
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

  it("supports Port, then Cruise line, then Ship", () => {
    const miami = changeChoice(combos, noChoice, "port", "Miami, Florida");
    expect(miami).toEqual({ cruiseLine: "", ship: "", port: "Miami, Florida" });
    const carnival = changeChoice(combos, miami, "cruiseLine", "Carnival");
    expect(carnival).toEqual({ cruiseLine: "Carnival", ship: "", port: "Miami, Florida" });
    expect(changeChoice(combos, carnival, "ship", "Carnival Glory")).toEqual({
      cruiseLine: "Carnival",
      ship: "Carnival Glory",
      port: "Miami, Florida",
    });
  });

  it("fills in what a port leaves no choice about", () => {
    expect(changeChoice(combos, noChoice, "port", "Port Canaveral, Florida")).toEqual({
      cruiseLine: "Carnival",
      ship: "Carnival Glory",
      port: "Port Canaveral, Florida",
    });
    const miami = { ...noChoice, port: "Miami, Florida" };
    expect(changeChoice(combos, miami, "cruiseLine", "Norwegian")).toEqual({
      cruiseLine: "Norwegian",
      ship: "Norwegian Joy",
      port: "Miami, Florida",
    });
  });

  it("clears only the cleared dropdown", () => {
    const joy = { cruiseLine: "Norwegian", ship: "Norwegian Joy", port: "Miami, Florida" };
    expect(changeChoice(combos, joy, "cruiseLine", "")).toEqual({ ...joy, cruiseLine: "" });
    expect(changeChoice(combos, joy, "ship", "")).toEqual({ ...joy, ship: "" });
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
