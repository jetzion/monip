import type { Payload, TypedUser, Where } from "payload";

/**
 * Admin preference behind "Hide sailings without arrival and departure times".
 * Stored as "hide" or "show": Payload saves a `false` preference as `{ value: false }`.
 */
export const TIMES_ONLY_KEY = "cruise-sailings-times-only";
export type TimesOnlyValue = "hide" | "show";

const hasValue = { exists: true, not_equals: "" };

/** Matches sailings that have both an arrival and a departure time. */
export const timesOnlyWhere: Where = { and: [{ arrival: hasValue }, { departure: hasValue }] };

/** Reads the signed-in admin's choice; on unless they turned it off. */
export async function isTimesOnly(payload: Payload, user: TypedUser | null): Promise<boolean> {
  if (!user) return true;
  const { docs } = await payload.find({
    collection: "payload-preferences",
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      key: { equals: TIMES_ONLY_KEY },
      "user.relationTo": { equals: user.collection },
      "user.value": { equals: user.id },
    },
  });
  return docs[0]?.value !== "show";
}
