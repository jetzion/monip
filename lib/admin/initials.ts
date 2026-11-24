/**
 * Up to two initials: the first letters of First name and Last name; with only
 * one of them, its first two letters; with neither, the start of the email.
 */
export function initialsOf(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string | null,
): string {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first || last) return (first || last).slice(0, 2).toUpperCase();
  const local = (email ?? "").split("@")[0].replace(/[^a-z0-9]/gi, "");
  return local.slice(0, 2).toUpperCase() || "?";
}

/** Avatar colours; each keeps white initials at a contrast of at least 4.5:1. */
export const AVATAR_COLORS = [
  "#1d4ed8", // blue
  "#047857", // green
  "#b91c1c", // red
  "#6d28d9", // violet
  "#c2410c", // orange
  "#0f766e", // teal
  "#be185d", // pink
  "#4338ca", // indigo
  "#a16207", // amber
  "#15803d", // emerald
  "#9333ea", // purple
  "#475569", // slate
] as const;

/** The same colour for the same user every time, from their id. */
export function avatarColor(key: string | number): string {
  let hash = 0;
  for (const character of String(key)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
