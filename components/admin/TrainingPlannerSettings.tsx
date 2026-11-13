"use client";

import { Button, DatePicker, ReactSelect } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { describeRules, removeRule } from "@/lib/training/planner/rules";
import type { FormSettings } from "@/lib/training/planner/interpret";
import { PRESETS, type Preset } from "@/lib/training/planner/types";

type Option = { label: string; value: string };
type Props = {
  initial: FormSettings;
  ships: string[];
  ports: string[];
  trainers: Option[];
  hasPlan: boolean;
  /** The instruction behind the current plan, if any. */
  instruction: string;
};

const HOURS: Option[] = ["2", "4", "8"].map((hours) => ({ label: `${hours} hours`, value: hours }));
const toOptions = (names: string[]): Option[] => names.map((name) => ({ label: name, value: name }));
const valuesOf = (option: unknown) => (Array.isArray(option) ? option.map((item: Option) => item.value) : []);

const post = (path: string, body: object) =>
  fetch(`/api/globals/training-plan/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }).catch(() => null);

type Interpretation = { settings: Props["initial"]; understood: string; notApplied: string[] };

/** The `error` message of a planner endpoint response. */
export async function errorOf(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : fallback;
}

/**
 * Settings for a plan, an instruction for the AI, and the buttons that make a
 * plan (replacing the current one): by hand, or from the instruction.
 */
export function TrainingPlannerSettings({ initial, ships, ports, trainers, hasPlan, instruction: initialInstruction }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [instruction, setInstruction] = useState(initialInstruction);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));
  const shipOptions = toOptions(ships);
  const portOptions = toOptions(ports);
  const trainerName = (id: number) => trainers.find((option) => option.value === String(id))?.label ?? "Removed trainer";
  const rules = describeRules(form.rules, trainerName);

  /** Makes the plan, then asks the AI for its summary (a plan without one is still fine). */
  const plan = async (settings: Props["initial"], note: Partial<Interpretation> & { instruction?: string } = {}) => {
    setBusy("Planning…");
    const response = await post("recommend", { ...settings, ...note });
    if (!response || !response.ok) {
      setBusy("");
      return setError(response ? await errorOf(response, "The plan could not be made. Try again.") : "The server could not be reached. Try again.");
    }
    setBusy("Writing the AI summary…");
    await post("summarize", {});
    setBusy("");
    router.refresh();
  };

  const recommend = async () => {
    setError("");
    await plan(form);
  };

  /** The AI turns the instruction into settings, shown in the form, then the plan is made from them. */
  const askAi = async () => {
    setError("");
    setBusy("Asking the AI…");
    const response = await post("interpret", { instruction, settings: form });
    if (!response || !response.ok) {
      setBusy("");
      return setError(response ? await errorOf(response, "The AI could not read the instruction.") : "The server could not be reached. Try again.");
    }
    const result = (await response.json()) as Interpretation;
    setForm(result.settings);
    await plan(result.settings, { instruction, understood: result.understood, notApplied: result.notApplied });
  };

  return (
    <section className="training-form" aria-labelledby="planner-settings-title">
      <div className="training-form__header">
        <h2 id="planner-settings-title">Plan settings</h2>
        <p className="training-form__check">Cruises starting between the two dates, up to about three months.</p>
      </div>
      <div className="training-form__fields">
        <div className="training-form__field">
          <label htmlFor="planner-from">First cruise start date</label>
          <DatePicker
            overrides={{ id: "planner-from" }}
            pickerAppearance="dayOnly"
            displayFormat="d MMM yyyy"
            value={form.from ? `${form.from}T12:00:00.000Z` : undefined}
            onChange={(date) => set({ from: date ? date.toISOString().slice(0, 10) : "" })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-to">Last cruise start date</label>
          <DatePicker
            overrides={{ id: "planner-to" }}
            pickerAppearance="dayOnly"
            displayFormat="d MMM yyyy"
            value={form.to ? `${form.to}T12:00:00.000Z` : undefined}
            onChange={(date) => set({ to: date ? date.toISOString().slice(0, 10) : "" })}
          />
        </div>
        <fieldset className="training-form__types">
          <legend>Plan</legend>
          {PRESETS.map((preset) => (
            <label key={preset.value}>
              <input
                type="radio"
                name="planner-preset"
                value={preset.value}
                checked={form.preset === preset.value}
                onChange={() => set({ preset: preset.value as Preset })}
              />
              {preset.label}
            </label>
          ))}
        </fieldset>
        <div className="training-form__field">
          <label htmlFor="planner-ships">Only these ships</label>
          <ReactSelect
            inputId="planner-ships"
            isMulti
            isClearable
            placeholder="All ships"
            options={shipOptions}
            value={shipOptions.filter((option) => form.ships.includes(option.value))}
            onChange={(option) => set({ ships: valuesOf(option) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-ports">Only these ports</label>
          <ReactSelect
            inputId="planner-ports"
            isMulti
            isClearable
            placeholder="All ports"
            options={portOptions}
            value={portOptions.filter((option) => form.ports.includes(option.value))}
            onChange={(option) => set({ ports: valuesOf(option) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-trainers">Only these trainers</label>
          <ReactSelect
            inputId="planner-trainers"
            isMulti
            isClearable
            placeholder="All trainers"
            options={trainers}
            value={trainers.filter((option) => form.trainers.includes(Number(option.value)))}
            onChange={(option) => set({ trainers: valuesOf(option).map(Number) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-priority">Priority ships (planned first)</label>
          <ReactSelect
            inputId="planner-priority"
            isMulti
            isClearable
            placeholder="None"
            options={shipOptions}
            value={shipOptions.filter((option) => form.priorityShips.includes(option.value))}
            onChange={(option) => set({ priorityShips: valuesOf(option) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-hours">Online session length</label>
          <ReactSelect
            inputId="planner-hours"
            options={HOURS}
            value={HOURS.find((option) => option.value === String(form.onlineHours))}
            onChange={(option) => set({ onlineHours: Number(Array.isArray(option) ? 2 : (option?.value ?? 2)) as 2 | 4 | 8 })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor="planner-nights">Longest cruise for onboarding (nights)</label>
          <input
            id="planner-nights"
            className="training-form__time"
            type="number"
            min={0}
            max={30}
            value={form.maxOnboardingNights}
            onChange={(event) => set({ maxOnboardingNights: Number(event.target.value) })}
          />
        </div>
      </div>
      {rules.length > 0 && (
        <div className="training-planner__rules">
          <h3 id="planner-rules-title">Rules</h3>
          <ul aria-labelledby="planner-rules-title">
            {rules.map((rule) => (
              <li key={rule.key}>
                {rule.text}{" "}
                <button
                  type="button"
                  className="training-planner__edit-button"
                  aria-label={`Remove rule: ${rule.text}`}
                  onClick={() => set({ rules: removeRule(form.rules, rule.key) })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="training-planner__instruction">
        <label htmlFor="planner-instruction">Instruction for the AI (optional)</label>
        <textarea
          id="planner-instruction"
          rows={3}
          maxLength={1000}
          placeholder="For example: Nicola is away 20–27 December, no onboarding over Christmas, use Declan for the Miami ships."
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
      </div>
      <div className="training-form__submit">
        <Button type="button" buttonStyle="primary" disabled={Boolean(busy) || !instruction.trim()} onClick={askAi}>
          Ask AI for a plan
        </Button>
        <Button type="button" buttonStyle="secondary" disabled={Boolean(busy)} onClick={recommend}>
          {hasPlan ? "Suggest a new plan" : "Recommend"} with these settings
        </Button>
        {busy && (
          <p className="training-form__check" role="status">
            {busy}
          </p>
        )}
        {hasPlan && (
          <p className="training-form__check">Replaces the current plan. Sessions you already accepted stay in the schedule.</p>
        )}
      </div>
      {error && (
        <div className="training-form__error" role="alert">
          <p>{error}</p>
        </div>
      )}
    </section>
  );
}
