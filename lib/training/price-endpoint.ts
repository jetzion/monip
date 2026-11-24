import type { Endpoint } from "payload";

import { isTrainingUser } from "../../access/roles";
import { createRateLimiter } from "../chat/rate-limit";

import { lookUpPrices } from "./firecrawl";
import { readTravel } from "./travel";

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Each lookup runs Firecrawl's agent (about a minute, up to 100 credits).
const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

/**
 * POST /api/training-sessions/estimate { travel, port }: current prices for the
 * trip found online (admins and trainers only). Only airports, dates, the
 * departure city, and the port are sent to Firecrawl.
 */
export const priceLookupEndpoint: Endpoint = {
  path: "/estimate",
  method: "post",
  handler: async (req) => {
    if (!req.user) return fail(401, "Log in to look up travel prices.");
    if (!isTrainingUser(req)) return fail(403, "Only admins and trainers can look up travel prices.");
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return fail(503, "Online price lookup is not set up. Use the rates or enter the amounts.");

    const body = (await req.json?.().catch(() => null)) as { travel?: unknown; port?: unknown } | null;
    const travel = readTravel(body?.travel);
    const port = typeof body?.port === "string" ? body.port.trim().slice(0, 200) : "";
    if (!travel || !port) return fail(400, "Send the trip and the cruise port.");
    if (!allow(String(req.user.id))) return fail(429, "Too many price lookups. Wait a few minutes and try again.");

    try {
      return Response.json({ prices: await lookUpPrices(travel, port, { apiKey }) });
    } catch (error) {
      req.payload.logger.warn({ msg: "Travel price lookup failed", reason: error instanceof Error ? error.message : "unknown" });
      return fail(502, "Prices could not be found online. Use the rates or enter the amounts.");
    }
  },
};
