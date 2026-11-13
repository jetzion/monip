import type { PayloadRequest } from "payload";

import { dayOf } from "../time";
import { cruiseNights, ineligibleReason } from "./slots";
import type { StoredPlan } from "./stored";
import type { PlanSailing } from "./types";

const day = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.parse(iso));

/** "5 Dec 2026 · Miami, Florida · 06:00–16:30 · 7 nights". */
export function cruiseLabel(sailing: PlanSailing) {
  const nights = cruiseNights(sailing);
  return [day(sailing.startDate), sailing.startPort, `${sailing.arrival}–${sailing.departure}`, nights === null ? null : `${nights} nights`]
    .filter(Boolean)
    .join(" · ");
}

/** For each ship in the plan, its plannable cruises in the plan's dates, as editor options. */
export async function cruiseOptions(req: PayloadRequest, stored: StoredPlan): Promise<Record<string, { label: string; value: string }[]>> {
  const ships = [...new Set(stored.plan.proposals.map((proposal) => proposal.sailing.ship))];
  if (ships.length === 0) return {};
  const access = { req, user: req.user, overrideAccess: false, pagination: false, limit: 0 } as const;
  const [sailings, zones] = await Promise.all([
    req.payload.find({
      collection: "cruise-sailings",
      ...access,
      depth: 0,
      sort: "startDate",
      where: {
        and: [
          { ship: { in: ships } },
          { startDate: { greater_than_equal: `${stored.settings.from}T00:00:00.000Z` } },
          { startDate: { less_than_equal: `${stored.settings.to}T23:59:59.999Z` } },
        ],
      },
      select: { ship: true, cruiseLine: true, startDate: true, endDate: true, startPort: true, endPort: true, arrival: true, departure: true },
    }),
    req.payload.find({ collection: "port-time-zones", ...access, depth: 0 }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const portZones = Object.fromEntries(zones.docs.map((zone) => [zone.port, zone.timeZone]));
  const options: Record<string, { label: string; value: string }[]> = {};
  for (const doc of sailings.docs) {
    const sailing: PlanSailing = {
      id: doc.id,
      ship: doc.ship,
      cruiseLine: doc.cruiseLine,
      startDate: doc.startDate,
      endDate: doc.endDate ?? null,
      startPort: doc.startPort ?? null,
      endPort: doc.endPort ?? null,
      arrival: doc.arrival ?? null,
      departure: doc.departure ?? null,
    };
    if (ineligibleReason(sailing, portZones) || dayOf(sailing.startDate) < today) continue;
    (options[sailing.ship] ??= []).push({ label: cruiseLabel(sailing), value: String(sailing.id) });
  }
  return options;
}
