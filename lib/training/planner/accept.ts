import type { PayloadRequest } from "payload";

import type { ItemStatus, StoredPlan } from "./stored";

export type Selection = { proposals: number[]; moves: number[] };

const message = (error: unknown) => (error instanceof Error && error.message ? error.message : "Could not be saved.");
const indexes = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item)) : []);

export const readSelection = (body: unknown): Selection => {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  return { proposals: indexes(input.proposals), moves: indexes(input.moves) };
};

/**
 * Applies the chosen moves, then creates the chosen sessions, each through the
 * normal session save (times recalculated, conflicts checked). Moves go first
 * because they free the time a proposal may need. Already accepted items are
 * skipped. Returns the plan with each item's outcome.
 */
export async function acceptItems(req: PayloadRequest, stored: StoredPlan, selection: Selection): Promise<StoredPlan> {
  const access = { req, user: req.user, overrideAccess: false, depth: 0 } as const;
  const moveStatus = { ...stored.moveStatus };
  const proposalStatus = { ...stored.proposalStatus };

  for (const index of selection.moves) {
    const move = stored.plan.moves[index];
    if (!move || moveStatus[index]?.status === "accepted") continue;
    try {
      // endDate null: onboarding ends with its new cruise, not the old one.
      await req.payload.update({ collection: "training-sessions", id: move.session.id, data: { ...move.to.fields, endDate: null }, ...access });
      moveStatus[index] = { status: "accepted" };
    } catch (error) {
      moveStatus[index] = { status: "failed", message: message(error) } satisfies ItemStatus;
    }
  }

  for (const index of selection.proposals) {
    const proposal = stored.plan.proposals[index];
    if (!proposal || proposalStatus[index]?.status === "accepted") continue;
    try {
      await req.payload.create({ collection: "training-sessions", data: proposal.fields, ...access });
      proposalStatus[index] = { status: "accepted" };
    } catch (error) {
      proposalStatus[index] = { status: "failed", message: message(error) };
    }
  }

  return { ...stored, moveStatus, proposalStatus };
}
