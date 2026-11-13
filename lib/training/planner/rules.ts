import { trainingDays } from "./bookings";
import type { PlanRules, PlanTrainer, Slot } from "./types";

const longDay = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.parse(`${day}T12:00:00Z`));
const span = (from: string | null, to: string | null) =>
  !from || !to ? "" : from === to ? ` on ${longDay(from)}` : ` from ${longDay(from)} to ${longDay(to)}`;
const TYPE_NAMES = { online: "online", departureDay: "departure-day", onboarding: "onboarding" } as const;

/** Score added when a trainer is preferred for the slot's port. */
export const PREFERRED_BONUS = 1.5;

/** The rules this slot breaks, as sentences; empty when it follows them all. */
export function ruleViolations(slot: Slot, trainer: PlanTrainer, rules: PlanRules): string[] {
  const days = trainingDays(slot.startsAt, slot.endsAt, slot.timeZone);
  const touches = (from: string | null, to: string | null) => !from || !to || days.some((day) => day >= from && day <= to);
  const broken: string[] = [];
  for (const rule of rules.unavailable) {
    if ((rule.trainerId === null || rule.trainerId === trainer.id) && touches(rule.from, rule.to)) {
      broken.push(`${rule.trainerId === null ? "No training is planned" : `${trainer.name} is unavailable`}${span(rule.from, rule.to)}.`);
    }
  }
  for (const rule of rules.blockedTypes) {
    if (rule.type === slot.type && touches(rule.from, rule.to)) broken.push(`No ${TYPE_NAMES[rule.type]} training${span(rule.from, rule.to)}.`);
  }
  const ports = slot.place ? [slot.place.startPort, slot.place.endPort] : [];
  for (const rule of rules.trainerPorts) {
    if (rule.mode === "avoid" && rule.trainerId === trainer.id && ports.includes(rule.port)) {
      broken.push(`${trainer.name} is kept away from ${rule.port}.`);
    }
  }
  return broken;
}

/** Extra score when the admin preferred this trainer for this in-person port. */
export function ruleBonus(slot: Slot, rules: PlanRules): number {
  const port = slot.place?.startPort;
  return rules.trainerPorts.some((rule) => rule.mode === "prefer" && rule.trainerId === slot.trainerId && rule.port === port) ? PREFERRED_BONUS : 0;
}

/** Each rule as a sentence for the settings list. */
export function describeRules(rules: PlanRules, trainerName: (id: number) => string): { key: string; text: string }[] {
  return [
    ...rules.unavailable.map((rule, index) => ({
      key: `unavailable:${index}`,
      text: `${rule.trainerId === null ? "No training for anyone" : `${trainerName(rule.trainerId)} unavailable`}${span(rule.from, rule.to)}`,
    })),
    ...rules.blockedTypes.map((rule, index) => ({
      key: `blockedTypes:${index}`,
      text: `No ${TYPE_NAMES[rule.type]} training${span(rule.from, rule.to) || " at all"}`,
    })),
    ...rules.trainerPorts.map((rule, index) => ({
      key: `trainerPorts:${index}`,
      text: `${rule.mode === "avoid" ? "Keep" : "Prefer"} ${trainerName(rule.trainerId)} ${rule.mode === "avoid" ? "away from" : "for"} ${rule.port}`,
    })),
    ...rules.excludeShips.map((ship, index) => ({ key: `excludeShips:${index}`, text: `Leave out ${ship}` })),
  ];
}

/** The rules without the one with this key (from describeRules). */
export function removeRule(rules: PlanRules, key: string): PlanRules {
  const [list, position] = key.split(":") as [keyof PlanRules, string];
  const index = Number(position);
  return { ...rules, [list]: (rules[list] as unknown[]).filter((_, item) => item !== index) };
}
