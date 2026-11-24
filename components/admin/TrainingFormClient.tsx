"use client";

import { Button, DatePicker, ReactSelect } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import {
  changeChoice,
  cruiseDatesLabel,
  cruiseDatesUrl,
  PICK_ORDERS,
  pickFields,
  noChoice,
  optionsFor,
  type CruiseChoice,
  type CruiseCombo,
  type PickOrder,
} from "@/lib/training/cruise-choice";
import { checkForm, emptyForm, errorMessages, formTravel, sessionBody, travelChoice, type CruiseOption, type FormState } from "@/lib/training/form";
import { estimateLines, withOverrides, type TravelRates } from "@/lib/training/estimate";
import { DURATIONS, TRAINING_TYPES } from "@/lib/training/schedule";

import { lookUpTripPrices, TrainingEstimate } from "./TrainingEstimate";
import { TrainingTravelFields } from "./TrainingTravelFields";

type Option = { label: string; value: string };

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; text: string } | { kind: "failed"; messages: string[] };

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const durationOptions: Option[] = DURATIONS.map((hours) => ({ label: `${hours} hours`, value: hours }));

type Props = {
  trainers: Option[];
  /** Home base port of each trainer (by id), for travel. */
  homeBases: Record<string, string | null>;
  portZones: Record<string, string>;
  /** Default and per-port travel rates, for the estimate. */
  rates: TravelRates;
  combos: CruiseCombo[];
  today: string;
};

/**
 * The Training Schedule's "Add to Calendar" form. A cruise is chosen by cruise
 * line, ship, port, and dates; the server works out the session times and
 * checks conflicts.
 */
export function TrainingFormClient({ trainers, homeBases, portZones, rates, combos, today }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => emptyForm(browserZone()));
  const [formKey, setFormKey] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // By Cruise/Ship (default) or By port: only the order of the cruise dropdowns changes.
  const [order, setOrder] = useState<PickOrder>("ship");
  // Counts estimate requests; a change to the form makes an answer still on its way stale.
  const lookupRef = useRef(0);
  // A session change suggests the travel again; any change needs a new estimate.
  const set = (changes: Partial<FormState>) => {
    lookupRef.current += 1;
    setForm((current) => ({ ...current, travelWanted: false, ...changes, travel: {}, estimate: null }));
  };
  const setTravel = (changes: FormState["travel"]) => {
    lookupRef.current += 1;
    setForm((current) => ({ ...current, travel: { ...current.travel, ...changes }, estimate: null }));
  };
  const changeEstimate = (changes: Partial<NonNullable<FormState["estimate"]>>) =>
    setForm((current) => (current.estimate ? { ...current, estimate: { ...current.estimate, ...changes } } : current));

  const homeBase = homeBases[form.trainer] ?? null;
  const choice = travelChoice(form, portZones, homeBase);
  const travel = formTravel(form, portZones, homeBase);
  const port = form.cruise?.startPort ?? null;
  // An onboarding cruise ending at another port: the trainer flies home from there.
  const endsElsewhere = form.type === "onboarding" && form.cruise?.endPort && form.cruise.endPort !== port ? form.cruise.endPort : null;
  const lines = travel ? withOverrides(estimateLines(travel, port, rates, form.estimate?.found), form.estimate?.overrides ?? {}) : null;

  /** Looks up the trip's prices online; the estimate falls back to the rates if that fails. */
  const estimate = async () => {
    if (!travel || !port) return;
    const request = ++lookupRef.current;
    setForm((current) => ({ ...current, estimate: { lookup: "loading", found: {}, overrides: {}, acknowledged: false } }));
    const result = await lookUpTripPrices(travel, port);
    if (lookupRef.current === request) changeEstimate(result);
  };
  const check = checkForm(form, portZones, homeBase);
  const zoneOptions = useMemo(() => Intl.supportedValuesOf("timeZone").map((zone) => ({ label: zone, value: zone })), []);

  const submit = async () => {
    setStatus({ kind: "saving" });
    const response = await fetch("/api/training-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionBody(form, travel, lines)),
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
        <h2 id="training-form-title">
          Schedule training <span className="training-form__hint">(select Cruise line or Port first)</span>
        </h2>
        <p>
          <Link href="/admin/collections/trainers">Manage trainers</Link> ·{" "}
          <Link href="/admin/collections/port-time-zones">Port time zones</Link>
        </p>
      </div>

      {/* Named for screen readers only; no visible label beside the buttons. */}
      <fieldset className="training-form__order" aria-label="Choose the cruise">
        {PICK_ORDERS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="training-order"
              value={option.value}
              checked={order === option.value}
              onChange={() => setOrder(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div className="training-form__fields" key={formKey}>
        <CruisePicker
          combos={combos}
          today={today}
          order={order}
          cruise={form.cruise}
          onChange={(cruise) => set({ cruise, endDate: "" })}
        />

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

        {choice === "optional" && (
          <label className="training-travel__choice training-travel__wanted">
            <input
              type="checkbox"
              checked={form.travelWanted}
              onChange={(event) => set({ travelWanted: event.target.checked })}
            />{" "}
            Travel needed (the trainer is based at this port)
          </label>
        )}

        {travel && <TrainingTravelFields travel={travel} onChange={setTravel} endPort={endsElsewhere} />}

        {travel && lines && (
          <div className="training-estimate__wrap">
            <Button buttonStyle="secondary" size="medium" disabled={form.estimate?.lookup === "loading"} onClick={() => void estimate()}>
              Estimate cost
            </Button>
            {form.estimate && (
              <TrainingEstimate
                state={form.estimate}
                lines={lines}
                onAmount={(item, amount) => changeEstimate({ overrides: { ...form.estimate?.overrides, [item]: amount }, acknowledged: false })}
                onAcknowledge={(acknowledged) => changeEstimate({ acknowledged })}
              />
            )}
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
  order: PickOrder;
  cruise: CruiseOption | null;
  onChange: (cruise: CruiseOption | null) => void;
};

/**
 * Cruise line, Ship, Port (or Port first, By port), and Cruise dates dropdowns.
 * The first three can be filled in any order, and each lists only what fits the others. Cruise dates
 * lists the ship's upcoming sailings from the port, loaded through the REST API.
 */
function CruisePicker({ combos, today, order, cruise, onChange }: PickerProps) {
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

  const labels = { cruiseLine: "Cruise line", ship: "Ship", port: "Port" } as const;
  const dropdowns = pickFields(order).map((field) => ({ field, label: labels[field], options: toOptions(optionsFor(combos, choice, field)) }));
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
          placeholder="Choose"
          options={dateOptions}
          value={cruise ? { label: cruiseDatesLabel(cruise), value: String(cruise.id) } : undefined}
          noOptionsMessage={() => "No upcoming sailings."}
          onChange={(option) => onChange(sailings.find((sailing) => String(sailing.id) === selectedValue(option)) ?? null)}
        />
      </div>
    </>
  );
}
