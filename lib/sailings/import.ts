import ExcelJS from "exceljs";
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type TypedUser,
} from "payload";

import type { CruiseSailing } from "../../payload-types";

import { SAILING_COLUMNS } from "./columns";
import { parseSailingRows, sailingKey, type RejectedRow, type SailingInput } from "./parse";
import { readSailingRows } from "./workbook";

export type ImportSummary = {
  processed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  rejected: RejectedRow[];
};

const isUnchanged = (existing: CruiseSailing, incoming: SailingInput) =>
  SAILING_COLUMNS.every(({ field }) => (existing[field] ?? null) === incoming[field]);

/** Loads an .xlsx file; throws if it is not a readable workbook. */
export async function loadWorkbook(data: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  return workbook;
}

/**
 * Imports the Sailings worksheet. Matches on Ship + Start date: updates
 * changed sailings, inserts new ones, and keeps sailings missing from the
 * workbook. Invalid rows are reported and skipped; any database error rolls
 * back the whole import. Throws if the worksheet or a column is missing.
 */
export async function importSailings(
  payload: Payload,
  workbook: ExcelJS.Workbook,
  user?: TypedUser,
): Promise<ImportSummary> {
  const { sailings, rejected } = parseSailingRows(readSailingRows(workbook));

  const existing = await payload.find({
    collection: "cruise-sailings",
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const byKey = new Map(existing.docs.map((doc) => [sailingKey(doc), doc]));

  const req = await createLocalReq({ user }, payload);
  await initTransaction(req);
  const summary: ImportSummary = { processed: sailings.length + rejected.length, inserted: 0, updated: 0, unchanged: 0, rejected };

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
    throw error;
  }
  return summary;
}
