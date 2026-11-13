import type { PayloadRequest } from "payload";

import type { PlanInput, PlanSettings } from "./types";

const idOf = (value: number | { id: number } | null | undefined) => (typeof value === "object" && value ? value.id : value);

/** Everything the planner needs for these settings, read with the admin's access. */
export async function loadPlanInput(req: PayloadRequest, settings: PlanSettings): Promise<PlanInput> {
  const { payload } = req;
  const access = { req, user: req.user, overrideAccess: false, pagination: false, limit: 0 } as const;
  const [sailings, trainers, sessions, zones, costs] = await Promise.all([
    payload.find({
      collection: "cruise-sailings",
      ...access,
      depth: 0,
      where: {
        and: [
          { startDate: { greater_than_equal: `${settings.from}T00:00:00.000Z` } },
          { startDate: { less_than_equal: `${settings.to}T23:59:59.999Z` } },
        ],
      },
      select: { ship: true, cruiseLine: true, startDate: true, endDate: true, startPort: true, endPort: true, arrival: true, departure: true },
    }),
    payload.find({ collection: "trainers", ...access, depth: 1, populate: { "port-time-zones": { port: true } } }),
    payload.find({
      collection: "training-sessions",
      ...access,
      depth: 1,
      select: { trainer: true, type: true, startsAt: true, endsAt: true, timeZone: true, fixed: true, cruise: true, cruiseCopy: true },
      populate: { "cruise-sailings": { endPort: true } },
    }),
    payload.find({ collection: "port-time-zones", ...access, depth: 0 }),
    payload.findGlobal({ slug: "training-costs", req, user: req.user, overrideAccess: false }),
  ]);

  return {
    settings,
    sailings: sailings.docs.map((sailing) => ({
      id: sailing.id,
      ship: sailing.ship,
      cruiseLine: sailing.cruiseLine,
      startDate: sailing.startDate,
      endDate: sailing.endDate ?? null,
      startPort: sailing.startPort ?? null,
      endPort: sailing.endPort ?? null,
      arrival: sailing.arrival ?? null,
      departure: sailing.departure ?? null,
    })),
    trainers: trainers.docs.map((trainer) => ({
      id: trainer.id,
      name: trainer.name ?? `${trainer.firstName} ${trainer.lastName}`,
      homeBase: typeof trainer.homeBase === "object" && trainer.homeBase ? trainer.homeBase.port : null,
      canJoinCruises: trainer.canJoinCruises ?? true,
      maxDaysPerMonth: trainer.maxDaysPerMonth ?? null,
    })),
    sessions: sessions.docs
      .filter((session) => session.startsAt && session.endsAt && session.timeZone)
      .map((session) => ({
        id: session.id,
        trainerId: idOf(session.trainer)!,
        ship: session.cruiseCopy?.ship ?? "",
        type: session.type,
        startsAt: session.startsAt!,
        endsAt: session.endsAt!,
        timeZone: session.timeZone!,
        fixed: Boolean(session.fixed),
        startPort: session.cruiseCopy?.startPort ?? null,
        endPort: typeof session.cruise === "object" && session.cruise ? (session.cruise.endPort ?? null) : null,
      })),
    portZones: Object.fromEntries(zones.docs.map((zone) => [zone.port, zone.timeZone])),
    costs: {
      onlineSession: costs.onlineSession ?? null,
      departureDaySession: costs.departureDaySession ?? null,
      onboardingDay: costs.onboardingDay ?? null,
      trip: costs.trip ?? null,
      night: costs.night ?? null,
    },
  };
}
