import { describe, expect, it } from "vitest";

import { SAILING_COLUMNS } from "./columns";
import { cellValue, parseSailingRows, toDay } from "./parse";

const header = SAILING_COLUMNS.map((column) => column.header);

const row = (overrides: Partial<Record<string, unknown>> = {}) => {
  const values: Record<string, unknown> = {
    "Cruise line": "Royal Caribbean",
    Ship: "Icon of the Seas",
    Operator: "Starboard",
    "Start date": new Date("2025-01-04T00:00:00.000Z"),
    "End date": new Date("2025-01-11T00:00:00.000Z"),
    Nights: 7,
    "Start port": "Miami, Florida",
    "End port": "Miami, Florida",
    "Ports in order": "Miami, Florida → At sea → Cozumel, Mexico",
    Confidence: "confirmed",
    Source: "https://example.com/sailing",
    Arrival: "06:00",
    Departure: "16:30",
    ...overrides,
  };
  return header.map((name) => values[name]);
};

describe("toDay", () => {
  it("stores Excel dates and YYYY-MM-DD text at 12:00 UTC on the same day", () => {
    expect(toDay(new Date("2025-01-04T00:00:00.000Z"))).toBe("2025-01-04T12:00:00.000Z");
    expect(toDay("2027-12-31")).toBe("2027-12-31T12:00:00.000Z");
  });

  it("returns null for blanks and flags invalid values", () => {
    expect(toDay(undefined)).toBeNull();
    expect(toDay("")).toBeNull();
    expect(toDay("2025-02-30")).toBe("invalid");
    expect(toDay("next week")).toBe("invalid");
  });
});

describe("cellValue", () => {
  it("unwraps hyperlink, rich text, and formula cells", () => {
    expect(cellValue({ text: "https://a.com", hyperlink: "https://a.com" })).toBe("https://a.com");
    expect(cellValue({ richText: [{ text: "Miami, " }, { text: "Florida" }] })).toBe("Miami, Florida");
    expect(cellValue({ formula: "A1+1", result: 8 })).toBe(8);
  });
});

describe("parseSailingRows", () => {
  it("maps every column by header name, regardless of order", () => {
    const reversed = [[...header].reverse(), row().reverse()];
    const { sailings, rejected } = parseSailingRows(reversed);
    expect(rejected).toEqual([]);
    expect(sailings).toEqual([
      {
        cruiseLine: "Royal Caribbean",
        ship: "Icon of the Seas",
        operator: "Starboard",
        startDate: "2025-01-04T12:00:00.000Z",
        endDate: "2025-01-11T12:00:00.000Z",
        nights: 7,
        startPort: "Miami, Florida",
        endPort: "Miami, Florida",
        portsInOrder: "Miami, Florida → At sea → Cozumel, Mexico",
        confidence: "confirmed",
        source: "https://example.com/sailing",
        arrival: "06:00",
        departure: "16:30",
      },
    ]);
  });

  it("trims text, stores blanks as null, and converts Excel times to HH:MM", () => {
    const { sailings } = parseSailingRows([
      header,
      row({ Ship: "  Icon of the Seas ", Source: undefined, Arrival: new Date("1899-12-30T07:30:00.000Z"), Departure: " " }),
    ]);
    expect(sailings[0]).toMatchObject({ ship: "Icon of the Seas", source: null, arrival: "07:30", departure: null });
  });

  it("throws when a required column header is missing", () => {
    expect(() => parseSailingRows([header.filter((name) => name !== "Ship"), []])).toThrow("Missing columns: Ship");
  });

  it("ignores blank rows and rejects invalid ones with their worksheet row number", () => {
    const { sailings, rejected } = parseSailingRows([
      header,
      row(),
      [],
      row({ Ship: "" }),
      row({ "Start date": "soon" }),
      row({ Nights: 7.5 }),
    ]);
    expect(sailings).toHaveLength(1);
    expect(rejected).toEqual([
      { row: 4, reason: "Ship is empty" },
      { row: 5, reason: "Start date is not a valid date" },
      { row: 6, reason: "Nights is not a whole number" },
    ]);
  });

  it("rejects a repeated ship and start date", () => {
    const { sailings, rejected } = parseSailingRows([header, row(), row({ Nights: 8 })]);
    expect(sailings).toHaveLength(1);
    expect(rejected).toEqual([{ row: 3, reason: "Same ship and start date as row 2" }]);
  });
});
