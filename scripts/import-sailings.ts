/**
 * Imports the Sailings worksheet of a fleet calendar workbook into the
 * Cruise Fleet Schedule. Matches on Ship + Start date: updates changed
 * sailings, inserts new ones, and keeps sailings missing from the workbook.
 * Invalid rows are reported and skipped; any database error rolls back the
 * whole import.
 * Run with: pnpm import:sailings "<path to workbook.xlsx>"
 */
import config from "@payload-config";
import ExcelJS from "exceljs";
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from "payload";

import { SAILING_COLUMNS, SAILINGS_SHEET } from "../lib/sailings/columns";
import { parseSailingRows, sailingKey, type SailingInput } from "../lib/sailings/parse";
import type { CruiseSailing } from "../payload-types";

const file = process.argv[2];
if (!file) throw new Error('Usage: pnpm import:sailings "<path to workbook.xlsx>"');

const readRows = async (path: string): Promise<unknown[][]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.getWorksheet(SAILINGS_SHEET);
  if (!sheet) throw new Error(`Worksheet "${SAILINGS_SHEET}" not found in ${path}`);
  const rows: unknown[][] = [];
  for (let n = 1; n <= sheet.rowCount; n++) {
    rows.push(Array.from(sheet.getRow(n).values as unknown[]).slice(1));
  }
  return rows;
};

const isUnchanged = (existing: CruiseSailing, incoming: SailingInput) =>
  SAILING_COLUMNS.every(({ field }) => (existing[field] ?? null) === incoming[field]);

const { sailings, rejected } = parseSailingRows(await readRows(file));

const payload = await getPayload({ config });
const existing = await payload.find({
  collection: "cruise-sailings",
  pagination: false,
  depth: 0,
  overrideAccess: true,
});
const byKey = new Map(existing.docs.map((doc) => [sailingKey(doc), doc]));

const req = await createLocalReq({}, payload);
await initTransaction(req);
const summary = { processed: sailings.length + rejected.length, inserted: 0, updated: 0, unchanged: 0, rejected: rejected.length };

try {
  for (const sailing of sailings) {
    const match = byKey.get(sailingKey(sailing));
    if (!match) {
      await payload.create({ collection: "cruise-sailings", data: sailing, req, overrideAccess: true });
      summary.inserted++;
    } else if (isUnchanged(match, sailing)) {
      summary.unchanged++;
    } else {
      await payload.update({ collection: "cruise-sailings", id: match.id, data: sailing, req, overrideAccess: true });
      summary.updated++;
    }
  }
  await commitTransaction(req);
} catch (error) {
  await killTransaction(req);
  console.error("Import failed; no changes were saved.");
  throw error;
}

for (const { row, reason } of rejected) console.log(`Rejected row ${row}: ${reason}`);
console.log("Import complete:", summary);
process.exit(0);
