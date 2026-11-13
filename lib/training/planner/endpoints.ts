import type { Endpoint, PayloadRequest } from "payload";

import { isAdminUser } from "../../../access/roles";

import { acceptItems, readSelection } from "./accept";
import { applyEdit, checkEdit, type Change } from "./edit";
import { loadPlanInput } from "./load";
import { buildPlan } from "./plan";
import { costText, travelText, whenText } from "./rows";
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

const TYPES = new Set(["online", "departureDay", "onboarding"]);

/** The edit request, or null when it is malformed. */
function readChange(body: unknown): { index: number; change: Change; save: boolean } | null {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const { index, cruise, trainer, type, startTime, save } = input;
  if (!Number.isInteger(index) || !Number.isInteger(cruise) || !Number.isInteger(trainer) || !TYPES.has(type as string)) return null;
  return {
    index: index as number,
    change: { cruise: cruise as number, trainer: trainer as number, type: type as Change["type"], startTime: typeof startTime === "string" ? startTime : null },
    save: save === true,
  };
}

/**
 * POST /api/globals/training-plan/edit { index, cruise, trainer, type, startTime?, save }:
 * checks a change to a proposed session and returns a preview with warnings;
 * with save, also stores it (admins only).
 */
export const editEndpoint: Endpoint = {
  path: "/edit",
  method: "post",
  handler: async (req) => {
    const refused = denied(req);
    if (refused) return refused;
    const { current } = await req.payload.findGlobal({ slug: "training-plan", req, user: req.user, overrideAccess: false });
    if (!isStoredPlan(current)) return fail(400, "There is no plan to edit. Recommend one first.");
    const request = readChange(await req.json?.());
    if (!request) return fail(400, "Choose a cruise, trainer, and training type.");
    if (current.proposalStatus[request.index]?.status === "accepted") {
      return fail(400, "This session was already accepted. Change it in the Training Schedule.");
    }
    const input = await loadPlanInput(req, { ...current.settings, now: new Date().toISOString() });
    const result = checkEdit(input, current, request.index, request.change);
    if ("error" in result) return fail(400, result.error);
    if (request.save) await save(req, applyEdit(input, current, request.index, result.slot));
    return Response.json({ when: whenText(result.slot), travel: travelText(result.slot), cost: costText(result.slot), warnings: result.warnings });
  },
};
