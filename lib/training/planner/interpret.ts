import { PRESETS, type PlanRules, type PlanSettings } from "./types";

/** Settings the admin can change in the form (and the AI from an instruction). */
export type FormSettings = Pick<
  PlanSettings,
  "from" | "to" | "preset" | "ships" | "ports" | "trainers" | "priorityShips" | "onlineHours" | "maxOnboardingNights" | "rules"
>;

export type InterpretContext = {
  today: string;
  trainers: { id: number; name: string }[];
  ports: string[];
  ships: string[];
  current: FormSettings;
};

export type Interpretation = { settings: FormSettings; understood: string; notApplied: string[] };

/** System prompt asking for the instruction as JSON settings. */
export function interpretPrompt(context: InterpretContext): string {
  return [
    "You turn an admin's instruction for a cruise-ship training plan into planner settings.",
    "Reply with one JSON object only, no other text, in this shape:",
    `{"understood": "one short sentence on what you applied", "notApplied": ["each part of the instruction you could not express"], "settings": {...}}`,
    "Include in settings only what the instruction changes. Allowed keys:",
    `- "from", "to": first and last cruise start date, "YYYY-MM-DD" (today is ${context.today}; at most 92 days apart)`,
    `- "preset": "balanced", "lowerCost" (mostly online), or "moreInPerson"`,
    `- "ships": only plan these ships; "priorityShips": plan these first; names exactly from the ship list`,
    `- "ports": only plan cruises starting from these ports (use this when the admin asks for a port only); names from the port list`,
    `- "trainers": only use these trainers (ids); use this when the admin names who should do the training`,
    `- "onlineHours": 2, 4, or 8; "maxOnboardingNights": longest cruise offered for onboarding`,
    `- "rules": the COMPLETE list of rules after the instruction (keep current rules unless the instruction changes or removes them):`,
    `  {"unavailable": [{"trainerId": id or null for everyone, "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}],`,
    `   "blockedTypes": [{"type": "online" | "departureDay" | "onboarding", "from": date or null, "to": date or null}],`,
    `   "trainerPorts": [{"trainerId": id, "port": name from the port list, "mode": "avoid" | "prefer"}],`,
    `   "excludeShips": [ship names]}`,
    "Never invent trainers, ships, or ports. Put anything you cannot express, or are unsure of, in notApplied.",
    `Trainers (id: name): ${context.trainers.map((trainer) => `${trainer.id}: ${trainer.name}`).join("; ") || "none"}`,
    `Ports: ${context.ports.join("; ")}`,
    `Ships: ${context.ships.join("; ")}`,
    `Current settings: ${JSON.stringify(context.current)}`,
  ].join("\n");
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (value: unknown): value is string => typeof value === "string" && DAY.test(value) && !Number.isNaN(Date.parse(value));
const objects = (value: unknown) => (Array.isArray(value) ? value : []).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
const TYPES = new Set(["online", "departureDay", "onboarding"]);

/** The JSON object in a model reply, which may be wrapped in a code fence. */
function parseJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const value = JSON.parse(text.slice(start, end + 1)) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The AI's reply as checked settings: only known trainers, ports, ships, and
 * valid dates are applied; everything else is listed as not applied.
 * Null when the reply is not usable JSON.
 */
export function readInterpretation(text: string, context: InterpretContext): Interpretation | null {
  const reply = parseJson(text);
  if (!reply) return null;
  const notApplied = (Array.isArray(reply.notApplied) ? reply.notApplied : []).filter((item): item is string => typeof item === "string" && item.trim() !== "");
  const input = (reply.settings && typeof reply.settings === "object" ? reply.settings : {}) as Record<string, unknown>;
  const settings: FormSettings = { ...context.current, rules: context.current.rules };
  const trainerIds = new Set(context.trainers.map((trainer) => trainer.id));
  const byLower = (names: string[]) => new Map(names.map((name) => [name.toLowerCase(), name]));
  const ships = byLower(context.ships);
  const ports = byLower(context.ports);
  const ship = (name: unknown) => {
    const found = typeof name === "string" ? ships.get(name.toLowerCase()) : undefined;
    if (!found) notApplied.push(`Unknown ship "${String(name)}".`);
    return found;
  };
  const shipList = (value: unknown) => [...new Set((Array.isArray(value) ? value : []).map(ship).filter((name): name is string => Boolean(name)))];
  const trainer = (id: unknown, label: string) => {
    if (id === null) return null;
    if (Number.isInteger(id) && trainerIds.has(id as number)) return id as number;
    notApplied.push(`Unknown trainer in "${label}".`);
    return undefined;
  };

  if (input.from !== undefined || input.to !== undefined) {
    if (isDay(input.from ?? settings.from) && isDay(input.to ?? settings.to)) {
      settings.from = (input.from as string | undefined) ?? settings.from;
      settings.to = (input.to as string | undefined) ?? settings.to;
    } else notApplied.push("The dates could not be read.");
  }
  if (input.preset !== undefined) {
    if (PRESETS.some((preset) => preset.value === input.preset)) settings.preset = input.preset as FormSettings["preset"];
    else notApplied.push("The plan type could not be read.");
  }
  if (input.ships !== undefined) settings.ships = shipList(input.ships);
  if (input.priorityShips !== undefined) settings.priorityShips = shipList(input.priorityShips);
  if (input.ports !== undefined) {
    settings.ports = [];
    for (const name of Array.isArray(input.ports) ? input.ports : []) {
      const port = typeof name === "string" ? ports.get(name.toLowerCase()) : undefined;
      if (port) settings.ports.push(port);
      else notApplied.push(`Unknown port "${String(name)}".`);
    }
  }
  if (input.trainers !== undefined) {
    settings.trainers = [];
    for (const id of Array.isArray(input.trainers) ? input.trainers : []) {
      const known = trainer(id, "trainers");
      if (known !== undefined && known !== null) settings.trainers.push(known);
    }
  }
  if (input.onlineHours !== undefined) {
    if ([2, 4, 8].includes(Number(input.onlineHours))) settings.onlineHours = Number(input.onlineHours) as 2 | 4 | 8;
    else notApplied.push("Online sessions can only be 2, 4, or 8 hours.");
  }
  if (input.maxOnboardingNights !== undefined) {
    const nights = Number(input.maxOnboardingNights);
    if (Number.isInteger(nights) && nights >= 0 && nights <= 30) settings.maxOnboardingNights = nights;
    else notApplied.push("The onboarding night limit must be 0 to 30.");
  }

  if (input.rules && typeof input.rules === "object") {
    const rules = input.rules as Record<string, unknown>;
    const next: PlanRules = { unavailable: [], blockedTypes: [], trainerPorts: [], excludeShips: [] };
    for (const rule of objects(rules.unavailable)) {
      const id = trainer(rule.trainerId, "unavailable");
      if (id === undefined) continue;
      if (isDay(rule.from) && isDay(rule.to) && rule.from <= rule.to) next.unavailable.push({ trainerId: id, from: rule.from, to: rule.to });
      else notApplied.push("An unavailable period had unclear dates.");
    }
    for (const rule of objects(rules.blockedTypes)) {
      const dated = isDay(rule.from) && isDay(rule.to) && rule.from <= rule.to;
      if (TYPES.has(rule.type as string) && (dated || (rule.from == null && rule.to == null))) {
        next.blockedTypes.push({ type: rule.type as PlanRules["blockedTypes"][number]["type"], from: dated ? (rule.from as string) : null, to: dated ? (rule.to as string) : null });
      } else notApplied.push("A training type rule could not be read.");
    }
    for (const rule of objects(rules.trainerPorts)) {
      const id = trainer(rule.trainerId, "port rule");
      const port = typeof rule.port === "string" ? ports.get(rule.port.toLowerCase()) : undefined;
      if (id === undefined || id === null) continue;
      if (!port) {
        notApplied.push(`Unknown port "${String(rule.port)}".`);
        continue;
      }
      if (rule.mode === "avoid" || rule.mode === "prefer") next.trainerPorts.push({ trainerId: id, port, mode: rule.mode });
    }
    next.excludeShips = shipList(rules.excludeShips);
    settings.rules = next;
  }

  const understood = typeof reply.understood === "string" && reply.understood.trim() ? reply.understood.trim() : "Settings updated.";
  return { settings, understood, notApplied: [...new Set(notApplied)] };
}
