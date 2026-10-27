import type { Endpoint } from "payload";

import { isAdminUser } from "../../access/roles";

import { readReportParams } from "./report";
import { loadReport } from "./report-data";
import { reportPdf } from "./report-pdf";

const fail = (status: number, error: string) => Response.json({ error }, { status });

/** "training-report-2026-10-to-2026-12.pdf". */
export const reportFilename = (from: string, to: string) => `training-report-${from === to ? from : `${from}-to-${to}`}.pdf`;

/** GET /api/training-sessions/report?trainer=&from=YYYY-MM&to=YYYY-MM&group=trainer|date: the report as a PDF (admins only). */
export const reportEndpoint: Endpoint = {
  path: "/report",
  method: "get",
  handler: async (req) => {
    if (!req.user) return fail(401, "Log in to download the report.");
    if (!isAdminUser(req)) return fail(403, "Only admins can download the report.");
    const now = new Date();
    const params = readReportParams(Object.fromEntries(new URL(req.url!).searchParams), now.toISOString().slice(0, 10));
    if ("error" in params) return fail(400, params.error);
    const report = await loadReport(req.payload, req.user, params);
    const generated = `${now.toISOString().slice(0, 16).replace("T", " ")} UTC`;
    return new Response(new Uint8Array(await reportPdf(report, generated)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFilename(params.from, params.to)}"`,
        "Cache-Control": "no-store",
      },
    });
  },
};
