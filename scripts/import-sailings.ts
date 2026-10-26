/**
 * Imports the Sailings worksheet of a fleet calendar workbook into the
 * Cruise Fleet Schedule (see lib/sailings/import.ts for the rules). Use this
 * for workbooks over the 4 MB admin upload limit.
 * Run with: pnpm import:sailings "<path to workbook.xlsx>"
 */
import { openAsBlob } from "node:fs";

import config from "@payload-config";
import { getPayload } from "payload";

import { importSailings, loadWorkbook } from "../lib/sailings/import";

const file = process.argv[2];
if (!file) throw new Error('Usage: pnpm import:sailings "<path to workbook.xlsx>"');

const workbook = await loadWorkbook(await (await openAsBlob(file)).arrayBuffer());
const payload = await getPayload({ config });

try {
  const { rejected, ...counts } = await importSailings(payload, workbook);
  for (const { row, reason } of rejected) console.log(`Rejected row ${row}: ${reason}`);
  console.log("Import complete:", { ...counts, rejected: rejected.length });
} catch (error) {
  console.error("Import failed; no changes were saved.");
  throw error;
}
process.exit(0);
