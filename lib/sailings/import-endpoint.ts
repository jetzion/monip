import type { Endpoint } from "payload";

import { isAdminUser } from "../../access/roles";

import { WorkbookFormatError } from "./columns";
import { importSailings, loadWorkbook } from "./import";

/** Upload limit, below Vercel's 4.5 MB request cap. A full Sailings sheet is about 1.4 MB. */
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * POST /api/cruise-sailings/import: imports an uploaded .xlsx (form field
 * "file") into the Cruise Fleet Schedule and returns the import summary.
 * Admins only. Nothing is saved if the database rejects any change.
 */
export const importEndpoint: Endpoint = {
  path: "/import",
  method: "post",
  handler: async (req) => {
    if (!req.user) return fail(401, "Log in to import sailings.");
    if (!isAdminUser(req)) return fail(403, "Only admins can import sailings.");

    // formData() throws when the body is not multipart; treat that as no file.
    const form = await req.formData?.().catch(() => undefined);
    const file = form?.get("file");
    if (!(file instanceof File)) return fail(400, "Choose an Excel file to import.");
    if (!file.name.toLowerCase().endsWith(".xlsx")) return fail(400, "The file must be an Excel workbook (.xlsx).");
    if (file.size > MAX_IMPORT_BYTES) {
      return fail(413, "The file is larger than 4 MB. Use the template, which holds only the Sailings sheet.");
    }

    const workbook = await loadWorkbook(await file.arrayBuffer()).catch(() => null);
    if (!workbook) return fail(400, "The file could not be read as an Excel workbook.");

    try {
      return Response.json(await importSailings(req.payload, workbook, req.user));
    } catch (error) {
      if (error instanceof WorkbookFormatError) {
        return fail(400, error.message);
      }
      req.payload.logger.error({ err: error }, "Sailings import failed");
      return fail(500, "The import failed and no changes were saved. Try again or contact the developer.");
    }
  },
};
