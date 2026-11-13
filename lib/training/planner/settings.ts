import { TRAINING_TYPES, type TrainingType } from "../schedule";
import { PRESETS, type PlanRules, type PlanSettings, type Preset } from "./types";

/** Longest range one plan covers, to keep plans reviewable and fast. */
export const MAX_RANGE_DAYS = 92;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const names = (value: unknown) =>
  Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim() !== ""))] : [];

const isDay = (value: unknown): value is string => typeof value === "string" && DAY.test(value);
const list = (value: unknown) => (Array.isArray(value) ? value : []).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
const isType = (value: unknown): value is TrainingType => TRAINING_TYPES.some((type) => type.value === value);

/** Plan rules from a request body; malformed entries are dropped. */
export function readRules(value: unknown): PlanRules {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    unavailable: list(input.unavailable)
      .filter((rule) => isDay(rule.from) && isDay(rule.to) && rule.from <= rule.to && (rule.trainerId === null || Number.isInteger(rule.trainerId)))
      .map((rule) => ({ trainerId: rule.trainerId as number | null, from: rule.from as string, to: rule.to as string })),
    blockedTypes: list(input.blockedTypes)
      .filter((rule) => isType(rule.type) && ((rule.from == null && rule.to == null) || (isDay(rule.from) && isDay(rule.to) && rule.from <= rule.to)))
      .map((rule) => ({ type: rule.type as TrainingType, from: (rule.from as string | undefined) ?? null, to: (rule.to as string | undefined) ?? null })),
    trainerPorts: list(input.trainerPorts)
      .filter((rule) => Number.isInteger(rule.trainerId) && typeof rule.port === "string" && rule.port && (rule.mode === "avoid" || rule.mode === "prefer"))
      .map((rule) => ({ trainerId: rule.trainerId as number, port: rule.port as string, mode: rule.mode as "avoid" | "prefer" })),
    excludeShips: names(input.excludeShips),
  };
}

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
      ports: names(input.ports),
      trainers: [...new Set((Array.isArray(input.trainers) ? input.trainers : []).filter((id): id is number => Number.isInteger(id)))],
      priorityShips: names(input.priorityShips),
      onlineHours,
      maxOnboardingNights: Number.isInteger(nights) && nights >= 0 && nights <= 30 ? nights : 7,
      now: now.toISOString(),
      rules: readRules(input.rules),
    },
  };
}
