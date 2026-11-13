"use client";

import { Button, ReactSelect } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ProposalValues } from "@/lib/training/planner/rows";
import { TRAINING_TYPES, type TrainingType } from "@/lib/training/schedule";

import { errorOf } from "./TrainingPlannerSettings";

export type Option = { label: string; value: string };
type Preview = { when: string; travel: string; cost: string; warnings: string[] };
type Props = { index: number; ship: string; values: ProposalValues; cruises: Option[]; trainers: Option[]; onClose: () => void };

const TYPE_OPTIONS: Option[] = TRAINING_TYPES.map((type) => ({ label: type.label, value: type.value }));
const pick = (option: unknown) => (option && !Array.isArray(option) ? (option as Option).value : "");

const post = (body: object) =>
  fetch("/api/globals/training-plan/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }).catch(() => null);

/**
 * Changes one proposed session: cruise (this ship's cruises in the plan's
 * dates), trainer, format, and an online start time. Each change is checked on
 * the server; planner rules show as warnings, conflicts as errors.
 */
export function TrainingPlannerEdit({ index, ship, values, cruises, trainers, onClose }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(values);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = (name: string) => `planner-edit-${index}-${name}`;
  const set = (patch: Partial<ProposalValues>) => setForm((current) => ({ ...current, ...patch }));

  useEffect(() => {
    let current = true;
    const check = async () => {
      const response = await post({ index, ...form, save: false });
      if (!current) return;
      if (!response) return setError("The server could not be reached. Try again.");
      if (!response.ok) {
        setPreview(null);
        return setError(await errorOf(response, "This change could not be checked."));
      }
      setError("");
      setPreview((await response.json()) as Preview);
    };
    // A short pause so typing a start time checks once.
    const timer = setTimeout(() => {
      void check();
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [index, form]);

  const save = async () => {
    setBusy(true);
    const response = await post({ index, ...form, save: true });
    setBusy(false);
    if (!response) return setError("The server could not be reached. Try again.");
    if (!response.ok) return setError(await errorOf(response, "This change could not be saved."));
    onClose();
    router.refresh();
  };

  return (
    <div className="training-planner__edit" role="group" aria-label={`Change the session for ${ship}`}>
      <div className="training-form__fields">
        <div className="training-form__field">
          <label htmlFor={id("cruise")}>Cruise</label>
          <ReactSelect
            inputId={id("cruise")}
            options={cruises}
            value={cruises.find((option) => option.value === String(form.cruise))}
            onChange={(option) => set({ cruise: Number(pick(option)) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor={id("trainer")}>Trainer</label>
          <ReactSelect
            inputId={id("trainer")}
            options={trainers}
            value={trainers.find((option) => option.value === String(form.trainer))}
            onChange={(option) => set({ trainer: Number(pick(option)) })}
          />
        </div>
        <div className="training-form__field">
          <label htmlFor={id("type")}>Training type</label>
          <ReactSelect
            inputId={id("type")}
            options={TYPE_OPTIONS}
            value={TYPE_OPTIONS.find((option) => option.value === form.type)}
            onChange={(option) => set({ type: pick(option) as TrainingType, startTime: null })}
          />
        </div>
        {form.type === "online" && (
          <div className="training-form__field">
            <label htmlFor={id("start")}>Start time (port time)</label>
            <input
              id={id("start")}
              className="training-form__time"
              placeholder="Earliest free"
              value={form.startTime ?? ""}
              onChange={(event) => set({ startTime: event.target.value || null })}
            />
          </div>
        )}
      </div>
      <div className="training-planner__preview" aria-live="polite">
        {error ? (
          <p className="training-planner__failed" role="alert">
            {error}
          </p>
        ) : preview ? (
          <>
            <p>
              <strong>Will be:</strong> {preview.when}. Travel: {preview.travel}. Cost: {preview.cost}.
            </p>
            {preview.warnings.length > 0 && (
              <ul className="training-planner__warnings">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Checking…</p>
        )}
      </div>
      <div className="training-form__submit">
        <Button type="button" buttonStyle="primary" disabled={busy || Boolean(error) || !preview} onClick={save}>
          {busy ? "Saving…" : preview?.warnings.length ? "Save anyway" : "Save change"}
        </Button>
        <Button type="button" buttonStyle="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
