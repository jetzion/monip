import type { Endpoint, PayloadRequest } from "payload";

import { completeChat } from "../../chat/openrouter";
import { siteUrl } from "../../site";
import { upcomingCruiseCombos } from "../cruise-options";
import { type FormSettings, interpretPrompt, readInterpretation } from "./interpret";
import { describeRules } from "./rules";
import { planRows } from "./rows";
import { readRules } from "./settings";
import { readStoredPlan, type StoredPlan } from "./stored";
import { PRESETS } from "./types";

const fail = (status: number, error: string) => Response.json({ error }, { status });
const MAX_INSTRUCTION = 1000;
// The model reasons before it writes, and the limit covers both: a 300-token cap gave an
// empty summary (374 reasoning + 316 text tokens on a December plan, 2026-11-12).
const INTERPRET_TOKENS = 2000;
const SUMMARY_TOKENS = 1200;
const UNAVAILABLE = "The AI is not available right now. Set the plan by hand, or try again.";

/** The form settings sent with an instruction, with safe defaults for missing values. */
function readForm(value: unknown): FormSettings {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const strings = (list: unknown) => (Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  return {
    from: typeof input.from === "string" ? input.from : "",
    to: typeof input.to === "string" ? input.to : "",
    preset: PRESETS.some((preset) => preset.value === input.preset) ? (input.preset as FormSettings["preset"]) : "balanced",
    ships: strings(input.ships),
    ports: strings(input.ports),
    trainers: Array.isArray(input.trainers) ? input.trainers.filter((id): id is number => Number.isInteger(id)) : [],
    priorityShips: strings(input.priorityShips),
    onlineHours: [2, 4, 8].includes(Number(input.onlineHours)) ? (Number(input.onlineHours) as 2 | 4 | 8) : 2,
    maxOnboardingNights: Number.isInteger(input.maxOnboardingNights) ? (input.maxOnboardingNights as number) : 7,
    rules: readRules(input.rules),
  };
}

/** POST /api/globals/training-plan/interpret { instruction, settings }: the instruction as checked settings (admins only). */
export const interpretEndpoint = (denied: (req: PayloadRequest) => Response | null): Endpoint => ({
  path: "/interpret",
  method: "post",
  handler: async (req) => {
    const refused = denied(req);
    if (refused) return refused;
    const body = ((await req.json?.()) ?? {}) as { instruction?: unknown; settings?: unknown };
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
    if (!instruction) return fail(400, "Type an instruction for the AI.");
    if (instruction.length > MAX_INSTRUCTION) return fail(400, `Keep the instruction under ${MAX_INSTRUCTION} characters.`);

    const today = new Date().toISOString().slice(0, 10);
    const access = { req, user: req.user, overrideAccess: false, pagination: false, limit: 0, depth: 0 } as const;
    const [trainers, zones, combos] = await Promise.all([
      req.payload.find({ collection: "trainers", ...access, select: { name: true } }),
      req.payload.find({ collection: "port-time-zones", ...access, select: { port: true } }),
      upcomingCruiseCombos(req.payload, today),
    ]);
    const context = {
      today,
      trainers: trainers.docs.map((trainer) => ({ id: trainer.id, name: trainer.name ?? "" })),
      ports: zones.docs.map((zone) => zone.port),
      ships: [...new Set(combos.map((combo) => combo.ship))].sort((a, b) => a.localeCompare(b)),
      current: readForm(body.settings),
    };
    const completion = await completeChat({
      system: interpretPrompt(context),
      messages: [{ role: "user", content: instruction }],
      siteUrl: siteUrl(),
      maxTokens: INTERPRET_TOKENS,
    });
    if (!completion.ok) return fail(503, UNAVAILABLE);
    const interpretation = readInterpretation(completion.reply, context);
    if (!interpretation) return fail(502, "The AI's answer could not be read. Try rephrasing the instruction.");
    return Response.json(interpretation);
  },
});

/** The facts the summary may use, as plain lines. */
export function summaryFacts(stored: StoredPlan, trainerNames: Map<number, string>): string {
  const rows = planRows(stored, trainerNames);
  const rules = describeRules(stored.settings.rules, (id) => trainerNames.get(id) ?? "a removed trainer").map((rule) => rule.text);
  return [
    rows.title,
    ...rows.lines,
    ...rows.load,
    `Ships not planned: ${rows.unscheduled.length}${rows.unscheduled.length ? ` (${rows.unscheduled.slice(0, 5).map((item) => item.ship).join(", ")})` : ""}.`,
    `Ships skipped for missing times: ${rows.skipped.length}.`,
    ...(rules.length ? [`Rules: ${rules.join("; ")}.`] : []),
    ...(stored.instruction ? [`Admin's instruction: ${stored.instruction}`] : []),
  ].join("\n");
}

const SUMMARY_PROMPT = [
  "You summarize a cruise-ship training plan for the admin who will review it.",
  "Write 2 to 4 plain sentences: what the plan covers, the main trade-off of its formats and travel, and what needs attention (ships not planned, travel, trainer limits, unknown costs).",
  "Use only the facts given. Do not invent numbers, ships, or trainers. No lists or headings.",
].join("\n");

/** POST /api/globals/training-plan/summarize: writes and stores the AI summary of the current plan (admins only). */
export const summarizeEndpoint = (denied: (req: PayloadRequest) => Response | null): Endpoint => ({
  path: "/summarize",
  method: "post",
  handler: async (req) => {
    const refused = denied(req);
    if (refused) return refused;
    const access = { req, user: req.user, overrideAccess: false } as const;
    const stored = readStoredPlan((await req.payload.findGlobal({ slug: "training-plan", ...access })).current);
    if (!stored) return fail(400, "There is no plan to summarize. Recommend one first.");
    const trainers = await req.payload.find({ collection: "trainers", ...access, depth: 0, limit: 0, pagination: false, select: { name: true } });
    const facts = summaryFacts(stored, new Map(trainers.docs.map((trainer) => [trainer.id, trainer.name ?? ""])));
    const completion = await completeChat({ system: SUMMARY_PROMPT, messages: [{ role: "user", content: facts }], siteUrl: siteUrl(), maxTokens: SUMMARY_TOKENS });
    if (!completion.ok) return fail(503, UNAVAILABLE);
    // Saved only if the plan was not replaced meanwhile.
    const latest = readStoredPlan((await req.payload.findGlobal({ slug: "training-plan", ...access })).current);
    if (latest?.createdAt === stored.createdAt) {
      await req.payload.updateGlobal({ slug: "training-plan", data: { current: { ...latest, aiSummary: completion.reply } }, ...access });
    }
    return Response.json({ summary: completion.reply });
  },
});
