"use client";

import { Button, DatePicker, ReactSelect } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import {
  changeChoice,
  cruiseDatesLabel,
  cruiseDatesUrl,
  cruiseLinesOf,
  noChoice,
  portsOf,
  shipsOf,
  type CruiseChoice,
  type CruiseCombo,
} from "@/lib/training/cruise-choice";
import { checkForm, emptyForm, errorMessages, sessionBody, type CruiseOption, type FormState } from "@/lib/training/form";
import { DURATIONS, TRAINING_TYPES } from "@/lib/training/schedule";

type Option = { label: string; value: string };

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; text: string } | { kind: "failed"; messages: string[] };

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const durationOptions: Option[] = DURATIONS.map((hours) => ({ label: `${hours} hours`, value: hours }));

type Props = {
  trainers: Option[];
  portZones: Record<string, string>;
  combos: CruiseCombo[];
  today: string;
};

/**
 * The Training Schedule's "Add to Calendar" form. A cruise is chosen by cruise
 * line, ship, port, and dates; the server works out the session times and
 * checks conflicts.
 */
export function TrainingFormClient({ trainers, portZones, combos, today }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => emptyForm(browserZone()));
  const [formKey, setFormKey] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const set = (changes: Partial<FormState>) => setForm((current) => ({ ...current, ...changes }));

  const check = checkForm(form, portZones);
  const zoneOptions = useMemo(() => Intl.supportedValuesOf("timeZone").map((zone) => ({ label: zone, value: zone })), []);

  const submit = async () => {
    setStatus({ kind: "saving" });
    const response = await fetch("/api/training-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionBody(form)),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok) {
      setStatus({ kind: "failed", messages: errorMessages(body) });
      return;
    }
    setStatus({ kind: "saved", text: `Added to the calendar: ${check.ready ? check.summary : ""} on ${form.cruise?.ship}.` });
    setForm(emptyForm(form.timeZone));
    setFormKey((key) => key + 1);
    router.refresh();
  };

  return (
    <section className="training-form" aria-labelledby="training-form-title">
      <div className="training-form__header">
        <h2 id="training-form-title">Schedule training</h2>
        <p>
          <Link href="/admin/collections/trainers">Manage trainers</Link> ·{" "}
          <Link href="/admin/collections/port-time-zones">Port time zones</Link>
        </p>
      </div>

      <div className="training-form__fields" key={formKey}>
        <CruisePicker combos={combos} today={today} cruise={form.cruise} onChange={(cruise) => set({ cruise, endDate: "" })} />

        <div className="training-form__field">
          <label htmlFor="training-trainer">Trainer</label>
          <ReactSelect
            inputId="training-trainer"
            isSearchable
            placeholder="Choose a trainer"
            options={trainers}
            value={trainers.find((trainer) => trainer.value === form.trainer)}
            noOptionsMessage={() => "No trainers yet. Add one under Manage trainers."}
            onChange={(option) => set({ trainer: Array.isArray(option) ? "" : String(option?.value ?? "") })}
          />
        </div>

        <fieldset className="training-form__types">
          <legend>Training type</legend>
          {TRAINING_TYPES.map((type) => (
            <label key={type.value}>
              <input
                type="radio"
                name="training-type"
                value={type.value}
                checked={form.type === type.value}
                onChange={() => set({ type: type.value })}
              />
              {type.label}
            </label>
          ))}
        </fieldset>

        {form.type === "online" && (
          <>
            <div className="training-form__field">
              <label htmlFor="training-date">Date</label>
              <DatePicker
                overrides={{ id: "training-date" }}
                pickerAppearance="dayOnly"
                displayFormat="d MMM yyyy"
                placeholder="Choose a date"
                value={form.date ? `${form.date}T12:00:00.000Z` : undefined}
                onChange={(date) => set({ date: date ? date.toISOString().slice(0, 10) : "" })}
              />
            </div>
            <div className="training-form__field">
              <label htmlFor="training-start">Start time</label>
              <input
                id="training-start"
                type="time"
                className="training-form__time"
                value={form.startTime}
                onChange={(event) => set({ startTime: event.target.value })}
              />
            </div>
            <div className="training-form__field">
              <label htmlFor="training-zone">Time zone</label>
              <ReactSelect
                inputId="training-zone"
                isSearchable
                options={zoneOptions}
                value={zoneOptions.find((zone) => zone.value === form.timeZone)}
                onChange={(option) => set({ timeZone: Array.isArray(option) ? "" : String(option?.value ?? "") })}
              />
            </div>
            <div className="training-form__field">
              <label htmlFor="training-duration">Duration</label>
              <ReactSelect
                inputId="training-duration"
                placeholder="Choose"
                options={durationOptions}
                value={durationOptions.find((duration) => duration.value === form.durationHours)}
                onChange={(option) => set({ durationHours: Array.isArray(option) ? "" : String(option?.value ?? "") })}
              />
            </div>
          </>
        )}

        {form.type === "onboarding" && form.cruise && (
          <div className="training-form__field">
            <label htmlFor="training-end">End date</label>
            <DatePicker
              overrides={{ id: "training-end" }}
              pickerAppearance="dayOnly"
              displayFormat="d MMM yyyy"
              placeholder="Cruise's end date"
              value={form.endDate ? `${form.endDate}T12:00:00.000Z` : (form.cruise.endDate ?? undefined)}
              onChange={(date) => set({ endDate: date ? date.toISOString().slice(0, 10) : "" })}
            />
          </div>
        )}
      </div>

      <div className="training-form__submit">
        <Button buttonStyle="primary" size="medium" disabled={!check.ready || status.kind === "saving"} onClick={() => void submit()}>
          Add to Calendar
        </Button>
        <p className="training-form__check">{check.ready ? check.summary : check.reason}</p>
      </div>

      <div role="status" className="training-form__saved">
        {status.kind === "saved" && status.text}
      </div>
      {status.kind === "failed" && (
        <div role="alert" className="training-form__error">
          {status.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </section>
  );
}

const toOptions = (values: string[]): Option[] => values.map((value) => ({ label: value, value }));

const selectedValue = (option: unknown) => (Array.isArray(option) ? "" : String((option as Option | null)?.value ?? ""));

type PickerProps = {
  combos: CruiseCombo[];
  today: string;
  cruise: CruiseOption | null;
  onChange: (cruise: CruiseOption | null) => void;
};

/**
 * Cruise line, Ship, Port, and Cruise dates dropdowns. Each list narrows to
 * the choices above it; Cruise dates lists the ship's upcoming sailings from
 * the port, loaded through the REST API.
 */
function CruisePicker({ combos, today, cruise, onChange }: PickerProps) {
  const [choice, setChoice] = useState<CruiseChoice>(noChoice);
  const [sailings, setSailings] = useState<CruiseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);

  const loadSailings = async (next: CruiseChoice) => {
    request.current?.abort();
    if (!next.ship || !next.port) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    const response = await fetch(cruiseDatesUrl(next, today), { signal: controller.signal }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (controller.signal.aborted) return;
    setSailings(response?.ok ? (body.docs as CruiseOption[]) : []);
    setLoading(false);
  };

  const change = (field: keyof CruiseChoice, value: string) => {
    const next = changeChoice(combos, choice, field, value);
    setChoice(next);
    setSailings([]);
    setLoading(false);
    onChange(null);
    void loadSailings(next);
  };

  const dropdowns: { field: keyof CruiseChoice; label: string; options: Option[] }[] = [
    { field: "cruiseLine", label: "Cruise line", options: toOptions(cruiseLinesOf(combos)) },
    { field: "ship", label: "Ship", options: toOptions(shipsOf(combos, choice.cruiseLine)) },
    { field: "port", label: "Port", options: toOptions(portsOf(combos, choice)) },
  ];
  const dateOptions = sailings.map((sailing) => ({ label: cruiseDatesLabel(sailing), value: String(sailing.id) }));
  const ready = Boolean(choice.ship && choice.port);

  return (
    <>
      {dropdowns.map(({ field, label, options }) => (
        <div className="training-form__field" key={field}>
          <label htmlFor={`training-${field}`}>{label}</label>
          {/* react-select keeps its own selection when value is cleared; remount so it shows the choice. */}
          <ReactSelect
            key={choice[field]}
            inputId={`training-${field}`}
            isSearchable
            isClearable
            placeholder="Choose"
            options={options}
            value={options.find((option) => option.value === choice[field])}
            onChange={(option) => change(field, selectedValue(option))}
          />
        </div>
      ))}
      <div className="training-form__field">
        <label htmlFor="training-dates">Cruise dates</label>
        <ReactSelect
          key={`${choice.ship}|${choice.port}|${cruise?.id ?? ""}`}
          inputId="training-dates"
          isSearchable
          isClearable
          disabled={!ready}
          isLoading={loading}
          placeholder={ready ? "Choose" : "Choose a ship and port first"}
          options={dateOptions}
          value={cruise ? { label: cruiseDatesLabel(cruise), value: String(cruise.id) } : undefined}
          noOptionsMessage={() => "No upcoming sailings."}
          onChange={(option) => onChange(sailings.find((sailing) => String(sailing.id) === selectedValue(option)) ?? null)}
        />
      </div>
    </>
  );
}
