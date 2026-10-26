import type { Endpoint } from "payload";

import { isAdminUser } from "../../access/roles";

import { buildSailingsTemplate } from "./workbook";

export const TEMPLATE_FILENAME = "cruise-sailings-template.xlsx";

const fail = (status: number, error: string) => Response.json({ error }, { status });

/** GET /api/cruise-sailings/template: the blank Excel import template (admins only). */
export const templateEndpoint: Endpoint = {
  path: "/template",
  method: "get",
  handler: async (req) => {
    if (!req.user) return fail(401, "Log in to download the template.");
    if (!isAdminUser(req)) return fail(403, "Only admins can download the template.");
    return new Response(new Uint8Array(await buildSailingsTemplate()), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME}"`,
        "Cache-Control": "no-store",
      },
    });
  },
};
