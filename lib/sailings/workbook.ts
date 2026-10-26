import ExcelJS from "exceljs";

import { SAILING_COLUMNS, SAILINGS_SHEET, WorkbookFormatError, type SailingField } from "./columns";

/** Rows in the template that get date and number checks. */
const TEMPLATE_ROWS = 1000;

const WIDTHS: Partial<Record<SailingField, number>> = {
  cruiseLine: 18,
  ship: 24,
  operator: 14,
  startDate: 13,
  endDate: 13,
  nights: 8,
  startPort: 28,
  endPort: 28,
  portsInOrder: 60,
  confidence: 14,
  source: 40,
};

/** Reads every row of the Sailings worksheet as cell values (first row = headers). */
export function readSailingRows(workbook: ExcelJS.Workbook): unknown[][] {
  const sheet = workbook.getWorksheet(SAILINGS_SHEET);
  if (!sheet) throw new WorkbookFormatError(`Worksheet "${SAILINGS_SHEET}" not found`);
  const rows: unknown[][] = [];
  for (let n = 1; n <= sheet.rowCount; n++) {
    rows.push(Array.from(sheet.getRow(n).values as unknown[]).slice(1));
  }
  return rows;
}

/**
 * Builds a blank import template: a Sailings worksheet with the 13 headers
 * the importer expects, date and whole-number checks, and Arrival/Departure
 * as text so Excel keeps "06:00" as typed.
 */
export async function buildSailingsTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SAILINGS_SHEET, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = SAILING_COLUMNS.map(({ header, field }) => ({ header, key: field, width: WIDTHS[field] ?? 12 }));
  sheet.getRow(1).font = { bold: true };

  for (const { field } of SAILING_COLUMNS) {
    const column = sheet.getColumn(field);
    if (field === "startDate" || field === "endDate") column.numFmt = "yyyy-mm-dd";
    if (field === "arrival" || field === "departure") column.numFmt = "@";
  }

  const dateCheck: ExcelJS.DataValidation = {
    type: "date",
    operator: "greaterThan",
    formulae: [new Date(Date.UTC(2000, 0, 1))],
    allowBlank: true,
    showErrorMessage: true,
    error: "Enter a date, for example 2026-10-03.",
  };
  const nightsCheck: ExcelJS.DataValidation = {
    type: "whole",
    operator: "greaterThanOrEqual",
    formulae: [0],
    allowBlank: true,
    showErrorMessage: true,
    error: "Enter a whole number of nights.",
  };
  for (let row = 2; row <= TEMPLATE_ROWS; row++) {
    sheet.getCell(row, sheet.getColumn("startDate").number).dataValidation = dateCheck;
    sheet.getCell(row, sheet.getColumn("endDate").number).dataValidation = dateCheck;
    sheet.getCell(row, sheet.getColumn("nights").number).dataValidation = nightsCheck;
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
