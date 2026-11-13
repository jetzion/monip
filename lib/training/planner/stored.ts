import type { Plan, PlanSettings } from "./types";

/** What happened when the admin accepted an item. */
export type ItemStatus = { status: "accepted" | "failed"; message?: string };

/** The current plan, kept until the admin asks for a new one. */
export type StoredPlan = {
  settings: PlanSettings;
  createdAt: string;
  createdBy: string;
  plan: Plan;
  /** By proposal or move index. */
  proposalStatus: Record<number, ItemStatus>;
  moveStatus: Record<number, ItemStatus>;
};

export const isStoredPlan = (value: unknown): value is StoredPlan =>
  Boolean(value && typeof value === "object" && "plan" in value && "settings" in value);
