import { describeSession, isFieldError, sessionTimes, type TrainingType } from "./schedule";

/** The cruise fields the scheduling form needs. */
export type CruiseOption = {
  id: number;
  ship: string;
  cruiseLine: string;
  startDate: string;
  endDate?: string | null;
  startPort?: string | null;
  arrival?: string | null;
  departure?: string | null;
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
});

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** "Carnival Conquest · Carnival · 1 Oct 2026 – 5 Oct 2026 · Miami, Florida". */
export function cruiseLabel(cruise: CruiseOption): string {
  const dates = cruise.endDate ? `${day(cruise.startDate)} – ${day(cruise.endDate)}` : day(cruise.startDate);
  return [cruise.ship, cruise.cruiseLine, dates, cruise.startPort].filter(Boolean).join(" · ");
}

const noon = (day: string) => (day ? `${day}T12:00:00.000Z` : null);

/**
 * Checks the form with the same rules the server uses. Returns the session
 * description when it can be added, or what is still missing or wrong.
 */
export function checkForm(form: FormState, portZones: Record<string, string>): { ready: true; summary: string } | { ready: false; reason: string } {
  if (!form.cruise) return { ready: false, reason: "Choose a cruise." };
  if (!form.trainer) return { ready: false, reason: "Choose a trainer." };
  if (!form.type) return { ready: false, reason: "Choose a training type." };
  const times = sessionTimes(
    { ...form, type: form.type, date: noon(form.date), endDate: noon(form.endDate) },
    form.cruise,
    portZones[form.cruise.startPort ?? ""] ?? null,
  );
  if (isFieldError(times)) return { ready: false, reason: times.message };
  return { ready: true, summary: describeSession({ ...times, type: form.type }) };
}

/** The request body for creating a session; the server works out the times. */
export function sessionBody(form: FormState) {
  return {
    cruise: form.cruise?.id,
    trainer: Number(form.trainer),
    type: form.type,
    ...(form.type === "online"
      ? { date: noon(form.date), startTime: form.startTime, timeZone: form.timeZone, durationHours: form.durationHours }
      : {}),
    ...(form.type === "onboarding" ? { endDate: noon(form.endDate) } : {}),
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
