import { NO_RULES, type Plan, type PlanSettings } from "./types";

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
  /** The admin's instruction to the AI, what it applied, and what it could not. */
  instruction?: string;
  understood?: string;
  notApplied?: string[];
  /** The AI's short summary of this plan. */
  aiSummary?: string;
};

const isStoredPlan = (value: unknown): value is StoredPlan =>
  Boolean(value && typeof value === "object" && "plan" in value && "settings" in value);

/** The stored plan, or null; plans saved before ports, trainers, or rules existed get none. */
export function readStoredPlan(value: unknown): StoredPlan | null {
  if (!isStoredPlan(value)) return null;
  const { settings } = value;
  return { ...value, settings: { ...settings, ports: settings.ports ?? [], trainers: settings.trainers ?? [], rules: settings.rules ?? NO_RULES } };
}
