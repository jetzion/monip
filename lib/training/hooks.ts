import { APIError, type CollectionBeforeDeleteHook, type CollectionBeforeValidateHook } from "payload";

import { describeSession, isFieldError, sessionTimes, TRAINING_TYPES, type FieldError, type TrainingType } from "./schedule";

const idOf = (value: unknown) =>
  value && typeof value === "object" && "id" in value ? (value as { id: number }).id : (value as number | null | undefined);

/**
 * A public 400 whose message is the readable reason. Not a ValidationError:
 * production builds bundle a second copy of Payload, so its `instanceof`
 * check fails and the REST response would drop the reason. The name is set
 * because minification empties the class name, and Payload's REST error
 * formatter only keeps the message of a named error.
 */
const reject = (error: FieldError): never => {
  const rejection = new APIError(error.message, 400, { errors: [error] }, true);
  rejection.name = "APIError";
  throw rejection;
};

/**
 * Sets a session's date, times, time zone, and title from the form and the
 * cruise, copies the cruise details, and rejects sessions that overlap another
 * session for the same trainer.
 */
export const scheduleSession: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const merged = { ...originalDoc, ...data };
  const cruiseId = idOf(merged.cruise);
  const trainerId = idOf(merged.trainer);
  const type = merged.type as TrainingType | undefined;
  if (!cruiseId) {
    const removed = originalDoc?.cruiseCopy?.ship
      ? "This session's cruise was removed from the Cruise Fleet Schedule. Choose another cruise."
      : "Choose a cruise.";
    return reject({ path: "cruise", message: removed });
  }
  if (!trainerId || !type) return data;

  const cruise = await req.payload.findByID({
    collection: "cruise-sailings",
    id: cruiseId,
    depth: 0,
    disableErrors: true,
    req,
  });
  if (!cruise) return reject({ path: "cruise", message: "This cruise is no longer in the Cruise Fleet Schedule. Choose another cruise." });

  const { docs: zones } = await req.payload.find({
    collection: "port-time-zones",
    where: { port: { equals: cruise.startPort ?? "" } },
    limit: 1,
    depth: 0,
    req,
  });
  const times = sessionTimes({ ...merged, type }, cruise, zones[0]?.timeZone ?? null);
  if (isFieldError(times)) return reject(times);

  const { docs: clashes } = await req.payload.find({
    collection: "training-sessions",
    where: {
      trainer: { equals: trainerId },
      startsAt: { less_than: times.endsAt },
      endsAt: { greater_than: times.startsAt },
      ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
    },
    limit: 1,
    depth: 0,
    req,
  });
  const clash = clashes[0];
  if (clash) {
    // The overlap query only matches sessions with both times set.
    const booked = describeSession({ ...clash, startsAt: clash.startsAt!, endsAt: clash.endsAt!, timeZone: clash.timeZone ?? "UTC" });
    reject({
      path: "trainer",
      message: `This trainer is already booked: ${booked} on ${clash.cruiseCopy?.ship ?? "a cruise"}.`,
    });
  }

  const trainer = await req.payload.findByID({ collection: "trainers", id: trainerId, depth: 0, disableErrors: true, req });
  const typeLabel = TRAINING_TYPES.find((option) => option.value === type)?.label ?? type;
  const online = type === "online";
  return {
    ...data,
    ...times,
    title: [typeLabel, trainer?.name, cruise.ship].filter(Boolean).join(" · "),
    startTime: online ? merged.startTime : null,
    durationHours: online ? merged.durationHours : null,
    cruiseCopy: {
      ship: cruise.ship,
      cruiseLine: cruise.cruiseLine,
      startDate: cruise.startDate,
      endDate: cruise.endDate ?? null,
      startPort: cruise.startPort ?? null,
      arrival: cruise.arrival ?? null,
      departure: cruise.departure ?? null,
    },
  };
};

/** Keeps a trainer while any session still uses them. */
export const keepBookedTrainer: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({ collection: "training-sessions", where: { trainer: { equals: id } }, req });
  if (totalDocs > 0) {
    throw new APIError(
      `This trainer has ${totalDocs} scheduled training session${totalDocs === 1 ? "" : "s"}. Reassign or delete them first.`,
      400,
      undefined,
      true,
    );
  }
};
