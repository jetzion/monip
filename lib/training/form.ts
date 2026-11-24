import type { EstimateLine, EstimateOverrides, FoundPrices } from "./estimate";
import { describeSession, isFieldError, sessionTimes, type SessionTimes, type TrainingType } from "./schedule";
import { isInPerson, needsTravel, trainingDays, travelData, travelDefaults, travelError, type Travel } from "./travel";

/** The cruise fields the scheduling form needs. */
export type CruiseOption = {
  id: number;
  ship: string;
  cruiseLine: string;
  startDate: string;
  endDate?: string | null;
  startPort?: string | null;
  endPort?: string | null;
  arrival?: string | null;
  departure?: string | null;
};

/** An estimate in the form or the session details. */
export type EstimateState = {
  lookup: "loading" | "done" | "failed";
  /** Why the lookup failed, shown above the estimate made from the rates. */
  message?: string;
  found: FoundPrices;
  overrides: EstimateOverrides;
  acknowledged: boolean;
};

export type FormState = {
  cruise: CruiseOption | null;
  trainer: string;
  type: TrainingType | "";
  date: string;
  startTime: string;
  timeZone: string;
  durationHours: string;
  endDate: string;
  /** Travel details the user changed; the rest come from travelDefaults. */
  travel: Partial<Travel>;
  /** Travel added by hand for in-person training at the trainer's home base. */
  travelWanted: boolean;
  /** Set by Estimate cost (prices found online, or the lookup in progress or failed); any other change clears it. */
  estimate: EstimateState | null;
};

export const emptyForm = (timeZone: string): FormState => ({
  cruise: null,
  trainer: "",
  type: "",
  date: "",
  startTime: "",
  timeZone,
  durationHours: "",
  endDate: "",
  travel: {},
  travelWanted: false,
  estimate: null,
});

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** "Carnival Conquest · Carnival · 1 Oct 2026 – 5 Oct 2026 · Miami, Florida". */
export function cruiseLabel(cruise: CruiseOption): string {
  const dates = cruise.endDate ? `${day(cruise.startDate)} – ${day(cruise.endDate)}` : day(cruise.startDate);
  return [cruise.ship, cruise.cruiseLine, dates, cruise.startPort].filter(Boolean).join(" · ");
}

const noon = (day: string) => (day ? `${day}T12:00:00.000Z` : null);

/** The session's times from the form, or why they cannot be worked out yet. */
function formTimes(form: FormState, portZones: Record<string, string>): { message: string } | (SessionTimes & { type: TrainingType }) {
  if (!form.cruise) return { message: "Choose a cruise." };
  if (!form.trainer) return { message: "Choose a trainer." };
  if (!form.type) return { message: "Choose a training type." };
  const times = sessionTimes(
    { ...form, type: form.type, date: noon(form.date), endDate: noon(form.endDate) },
    form.cruise,
    portZones[form.cruise.startPort ?? ""] ?? null,
  );
  return isFieldError(times) ? { message: times.message } : { ...times, type: form.type };
}

/**
 * Whether the form's session has a trip: "needed" (in-person away from home
 * base, or onboarding on a cruise ending elsewhere), "optional" (in-person at
 * home base: the Travel needed box), or "none" (online, or the times are not known yet).
 */
export function travelChoice(form: FormState, portZones: Record<string, string>, homeBase: string | null): "needed" | "optional" | "none" {
  const times = formTimes(form, portZones);
  if ("message" in times || !isInPerson(times.type)) return "none";
  return needsTravel(times.type, homeBase, form.cruise?.startPort, form.cruise?.endPort) ? "needed" : "optional";
}

/**
 * The trip for the form's session: the defaults with the user's changes, or
 * null when there is none (online, at home base without Travel needed, or the times are not known yet).
 */
export function formTravel(form: FormState, portZones: Record<string, string>, homeBase: string | null): Travel | null {
  const times = formTimes(form, portZones);
  const choice = travelChoice(form, portZones, homeBase);
  if ("message" in times || choice === "none" || (choice === "optional" && !form.travelWanted)) return null;
  return { ...travelDefaults(times.type, trainingDays(times), homeBase), ...form.travel };
}

/**
 * Checks the form with the same rules the server uses. Returns the session
 * description when it can be added, or what is still missing or wrong.
 */
export function checkForm(
  form: FormState,
  portZones: Record<string, string>,
  homeBase: string | null,
): { ready: true; summary: string } | { ready: false; reason: string } {
  const times = formTimes(form, portZones);
  if ("message" in times) return { ready: false, reason: times.message };
  const travel = formTravel(form, portZones, homeBase);
  const problem = travel && travelError(travel, trainingDays(times));
  if (problem) return { ready: false, reason: problem.message };
  if (travel && !form.estimate) return { ready: false, reason: "Click Estimate cost to see the travel cost." };
  if (travel && form.estimate?.lookup === "loading") return { ready: false, reason: "Looking up current prices online." };
  if (travel && !form.estimate?.acknowledged) return { ready: false, reason: "Acknowledge the estimated travel cost." };
  return { ready: true, summary: describeSession(times) };
}

/** The request body for creating a session; the server works out the times. */
export function sessionBody(form: FormState, travel: Travel | null, lines: EstimateLine[] | null) {
  return {
    cruise: form.cruise?.id,
    trainer: Number(form.trainer),
    type: form.type,
    ...(form.type === "online"
      ? { date: noon(form.date), startTime: form.startTime, timeZone: form.timeZone, durationHours: form.durationHours }
      : {}),
    ...(form.type === "onboarding" ? { endDate: noon(form.endDate) } : {}),
    ...(travel ? { travel: travelData(travel) } : {}),
    // The server stamps the acknowledgement; a new time marks it as new.
    ...(travel && lines && form.estimate?.acknowledged ? { estimate: { lines, acknowledgedAt: new Date().toISOString() } } : {}),
  };
}

type PayloadErrorBody = { errors?: { message?: string; data?: { errors?: { message?: string }[] } }[] };

/** Readable messages from a Payload REST error response. */
export function errorMessages(body: unknown): string[] {
  const errors = (body as PayloadErrorBody | null)?.errors ?? [];
  const messages = errors.flatMap((error) => {
    const fields = error.data?.errors?.map((field) => field.message).filter(Boolean) as string[] | undefined;
    return fields?.length ? fields : error.message ? [error.message] : [];
  });
  return messages.length ? messages : ["The session could not be saved. Check your connection and try again."];
}
