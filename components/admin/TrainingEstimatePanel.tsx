"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  estimateLines,
  TRAVEL_STATUS_TEXT,
  usd,
  withOverrides,
  type StoredEstimate,
  type TravelRates,
  type TravelStatus,
} from "@/lib/training/estimate";
import { errorMessages, type EstimateState } from "@/lib/training/form";
import { travelData, travelError, type TrainingDays, type Travel } from "@/lib/training/travel";

import { lookUpTripPrices, TrainingEstimate } from "./TrainingEstimate";
import { TrainingTravelFields } from "./TrainingTravelFields";

type Props = {
  id: number;
  status: TravelStatus;
  /** The trip to start from: the session's own, or one suggested from the training (planner sessions). */
  suggested: Travel | null;
  /** The training's first and last day, to check the trip. */
  days: TrainingDays | null;
  port: string | null;
  /** Where an onboarding cruise ends, when not where it starts. */
  endPort: string | null;
  rates: TravelRates;
  stored: StoredEstimate | null;
  /** False when the user cannot change the session (a trainer, after it started). */
  canEdit: boolean;
};

const stamp = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso),
  );

/**
 * The session's travel cost: the acknowledged estimate, or the trip and a new
 * estimate to make and save together (for planner sessions without travel, or
 * when the trip, port, or times changed).
 */
export function TrainingEstimatePanel({ id, status, suggested, days, port, endPort, rates, stored, canEdit }: Props) {
  const router = useRouter();
  const [trip, setTrip] = useState<Travel | null>(suggested);
  const [estimate, setEstimate] = useState<EstimateState | null>(null);
  // Counts lookups; a changed trip makes an answer still on its way stale.
  const lookupRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (status === "ok" && !stored) return null;
  if (status === "ok" && stored) {
    return (
      <div className="training-details__estimate">
        <p>
          <strong>Estimated travel cost: {usd(stored.total)}</strong>
          {stored.lines.length > 0 && ` (${stored.lines.map((line) => `${line.label} ${usd(line.amount ?? 0)}`).join(", ")})`}
        </p>
        <p className="training-form__hint">
          Acknowledged by {stored.acknowledgedBy || "unknown"} on {stamp(stored.acknowledgedAt)}.
        </p>
      </div>
    );
  }

  const problem = trip && days ? travelError(trip, days) : null;
  const lines = trip && estimate ? withOverrides(estimateLines(trip, port, rates, estimate.found), estimate.overrides) : null;
  const change = (changes: Partial<EstimateState>) => setEstimate((current) => (current ? { ...current, ...changes } : current));
  // A changed trip needs a new estimate.
  const changeTrip = (changes: Partial<Travel>) => {
    setTrip((current) => (current ? { ...current, ...changes } : current));
    setEstimate(null);
    lookupRef.current += 1;
  };
  const lookUp = async () => {
    if (!trip || !port) return;
    const request = ++lookupRef.current;
    setEstimate({ lookup: "loading", found: {}, overrides: {}, acknowledged: false });
    const result = await lookUpTripPrices(trip, port);
    if (lookupRef.current === request) change(result);
  };
  const save = async () => {
    if (!trip) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/training-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travel: travelData(trip), estimate: { lines, acknowledgedAt: new Date().toISOString() } }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) return setError(errorMessages(await response?.json().catch(() => null)).join(" "));
    router.refresh();
  };

  return (
    <div className="training-details__review" role="note" aria-label="Travel">
      <p>
        <strong>{TRAVEL_STATUS_TEXT[status as Exclude<TravelStatus, "ok">]}</strong>
      </p>
      {trip && canEdit && (
        <>
          <TrainingTravelFields travel={trip} onChange={changeTrip} endPort={endPort} />
          {problem ? (
            <p className="training-form__check">{problem.message}</p>
          ) : (
            <div className="training-details__actions">
              <Button buttonStyle="secondary" size="medium" disabled={estimate?.lookup === "loading"} onClick={() => void lookUp()}>
                Estimate cost
              </Button>
            </div>
          )}
          {estimate && lines && !problem && (
            <>
              <TrainingEstimate
                state={estimate}
                lines={lines}
                onAmount={(item, amount) => change({ overrides: { ...estimate.overrides, [item]: amount }, acknowledged: false })}
                onAcknowledge={(acknowledged) => change({ acknowledged })}
              />
              <div className="training-details__actions">
                <Button buttonStyle="primary" size="medium" disabled={!estimate.acknowledged || saving} onClick={() => void save()}>
                  Save travel and estimate
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="training-form__error">
          {error}
        </p>
      )}
    </div>
  );
}
