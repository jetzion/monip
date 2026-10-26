import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { SAILING_COLUMNS, SAILINGS_SHEET } from "./columns";
import { parseSailingRows } from "./parse";
import { buildSailingsTemplate, readSailingRows } from "./workbook";

const load = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
};

describe("buildSailingsTemplate", () => {
  it("has a Sailings worksheet with the 13 headers in order and no sailings", async () => {
    const workbook = await load(await buildSailingsTemplate());
    const rows = readSailingRows(workbook);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([SAILINGS_SHEET]);
    expect(rows[0]).toEqual(SAILING_COLUMNS.map((column) => column.header));
    expect(parseSailingRows(rows)).toEqual({ sailings: [], rejected: [] });
  });

  it("imports a completed template without renaming anything", async () => {
    const workbook = await load(await buildSailingsTemplate());
    workbook.getWorksheet(SAILINGS_SHEET)!.getRow(2).values = [
      "Royal Caribbean",
      "Icon of the Seas",
      "Starboard",
      new Date("2026-10-03T00:00:00.000Z"),
      new Date("2026-10-10T00:00:00.000Z"),
      7,
      "Miami, Florida",
      "Miami, Florida",
      "Miami, Florida → At sea → Cozumel, Mexico",
      "confirmed",
      "https://example.com/sailing",
      "06:00",
      "16:30",
    ];
    const reloaded = await load(Buffer.from(await workbook.xlsx.writeBuffer()));
    const { sailings, rejected } = parseSailingRows(readSailingRows(reloaded));
    expect(rejected).toEqual([]);
    expect(sailings).toEqual([
      expect.objectContaining({
        ship: "Icon of the Seas",
        startDate: "2026-10-03T12:00:00.000Z",
        endDate: "2026-10-10T12:00:00.000Z",
        nights: 7,
        arrival: "06:00",
        departure: "16:30",
      }),
    ]);
  });

  it("throws when the Sailings worksheet is missing", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Sheet1");
    expect(() => readSailingRows(workbook)).toThrow('Worksheet "Sailings" not found');
  });
});
