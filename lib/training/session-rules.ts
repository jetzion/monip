import { APIError, type Access, type CollectionBeforeValidateHook } from "payload";

import { isAdminUser, isTrainingUser } from "../../access/roles";
import { readTravel } from "./travel";

/** Session fields set by whoever schedules or edits it. */
const EDITABLE = ["cruise", "trainer", "type", "date", "startTime", "timeZone", "durationHours", "endDate", "fixed", "travel"] as const;

type Doc = Record<string, unknown>;

const idOf = (value: unknown) =>
  value && typeof value === "object" && "id" in value ? (value as { id: unknown }).id : value;
const normal = (field: string, value: unknown) =>
  field === "travel" ? JSON.stringify(readTravel(value)) : (idOf(value) ?? null);

/** Editable fields the update changes; fields missing from the update are unchanged. */
export function changedFields(data: Doc, original: Doc): string[] {
  return EDITABLE.filter((field) => field in data && normal(field, data[field]) !== normal(field, original[field]));
}

/** True once the session's start time has passed. */
export const hasStarted = (original: Doc, now: Date) =>
  typeof original.startsAt === "string" && Date.parse(original.startsAt) <= now.getTime();

/** True when the update only cancels the session (nothing to recalculate or check). */
export const isCancelOnly = (data: Doc, original: Doc | undefined) =>
  Boolean(original) && data.canceled === true && original!.canceled !== true && changedFields(data, original!).length === 0;

/** Admins delete any session; trainers only sessions that have not started. */
export const canDeleteSession: Access = ({ req }) => {
  if (isAdminUser(req)) return true;
  if (isTrainingUser(req)) return { startsAt: { greater_than: new Date().toISOString() } };
  return false;
};

/** Trainers cannot change a session once it has started; they can still cancel or restore it. */
export const guardStartedSession: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data || !originalDoc || isAdminUser(req) || !hasStarted(originalDoc, new Date())) return data;
  const togglesCancel = "canceled" in data && Boolean(data.canceled) !== Boolean(originalDoc.canceled);
  if (togglesCancel && changedFields(data, originalDoc).length === 0) return data;
  const refusal = new APIError("This session has started. You can only cancel it or restore it.", 403, undefined, true);
  refusal.name = "APIError";
  throw refusal;
};
