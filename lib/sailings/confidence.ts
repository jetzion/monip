export type ConfidenceTone = "confirmed" | "calendar" | "unconfirmed" | "pattern" | "other";

/**
 * The colour group of a sailing's Confidence (free text from the workbook):
 * confirmed, from a cruise line's own calendar, unconfirmed, inferred from a
 * pattern, or anything else.
 */
export function confidenceTone(value: string): ConfidenceTone {
  const text = value.trim().toLowerCase();
  if (text === "confirmed") return "confirmed";
  if (text === "unconfirmed") return "unconfirmed";
  if (text === "pattern") return "pattern";
  if (text.includes("calendar")) return "calendar";
  return "other";
}
