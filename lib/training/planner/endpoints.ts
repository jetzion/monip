import type { Endpoint, PayloadRequest } from "payload";

import { isAdminUser } from "../../../access/roles";

import { acceptItems, readSelection } from "./accept";
import { loadPlanInput } from "./load";
import { buildPlan } from "./plan";
import { readPlanSettings } from "./settings";
import { isStoredPlan, type StoredPlan } from "./stored";

const fail = (status: number, error: string) => Response.json({ error }, { status });

const denied = (req: PayloadRequest) =>
  !req.user ? fail(401, "Log in to use the training planner.") : !isAdminUser(req) ? fail(403, "Only admins can use the training planner.") : null;

const save = (req: PayloadRequest, current: StoredPlan) =>
  req.payload.updateGlobal({ slug: "training-plan", data: { current }, req, user: req.user, overrideAccess: false });

/** POST /api/globals/training-plan/recommend: builds a plan and replaces the stored one (admins only). */
export const recommendEndpoint: Endpoint = {
  path: "/recommend",
  method: "post",
  handler: async (req) => {
    const refused = denied(req);
    if (refused) return refused;
    const read = readPlanSettings(await req.json?.(), new Date());
    if ("error" in read) return fail(400, read.error);
    const plan = buildPlan(await loadPlanInput(req, read.settings));
    const current: StoredPlan = {
      settings: read.settings,
      createdAt: new Date().toISOString(),
      createdBy: req.user!.email ?? "",
      plan,
      proposalStatus: {},
      moveStatus: {},
    };
    await save(req, current);
    return Response.json({ proposals: plan.proposals.length, moves: plan.moves.length });
  },
};

/** POST /api/globals/training-plan/accept { proposals: number[], moves: number[] } (admins only). */
export const acceptEndpoint: Endpoint = {
  path: "/accept",
  method: "post",
  handler: async (req) => {
    const refused = denied(req);
    if (refused) return refused;
    const { current } = await req.payload.findGlobal({ slug: "training-plan", req, user: req.user, overrideAccess: false });
    if (!isStoredPlan(current)) return fail(400, "There is no plan to accept. Recommend one first.");
    const selection = readSelection(await req.json?.());
    if (selection.proposals.length + selection.moves.length === 0) return fail(400, "Tick at least one session or move.");
    const updated = await acceptItems(req, current, selection);
    await save(req, updated);
    const failed = [...Object.values(updated.proposalStatus), ...Object.values(updated.moveStatus)].filter((item) => item.status === "failed");
    return Response.json({ failed: failed.length });
  },
};
