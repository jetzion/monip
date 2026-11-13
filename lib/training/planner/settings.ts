import { PRESETS, type PlanSettings, type Preset } from "./types";

/** Longest range one plan covers, to keep plans reviewable and fast. */
export const MAX_RANGE_DAYS = 92;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const names = (value: unknown) =>
  Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim() !== ""))] : [];

/** The planner settings from a request body, or the reason they cannot be used. */
export function readPlanSettings(body: unknown, now: Date): { settings: PlanSettings } | { error: string } {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const { from, to, preset } = input;
  if (typeof from !== "string" || !DAY.test(from) || typeof to !== "string" || !DAY.test(to)) {
    return { error: "Choose the first and last cruise start dates." };
  }
  if (to < from) return { error: "The last date must be on or after the first." };
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (days > MAX_RANGE_DAYS) return { error: `Choose at most ${MAX_RANGE_DAYS} days (about three months).` };
  if (to < now.toISOString().slice(0, 10)) return { error: "Choose dates from today on." };
  if (!PRESETS.some((option) => option.value === preset)) return { error: "Choose Balanced, Lower cost, or More in-person." };
  const onlineHours = [2, 4, 8].includes(Number(input.onlineHours)) ? (Number(input.onlineHours) as 2 | 4 | 8) : 2;
  const nights = Number(input.maxOnboardingNights);
  return {
    settings: {
      from,
      to,
      preset: preset as Preset,
      ships: names(input.ships),
      priorityShips: names(input.priorityShips),
      onlineHours,
      maxOnboardingNights: Number.isInteger(nights) && nights >= 0 && nights <= 30 ? nights : 7,
      now: now.toISOString(),
    },
  };
}
