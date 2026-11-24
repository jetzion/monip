/** Up to two initials: first and last word of the name, else the start of the email. */
export function initialsOf(name: string | null | undefined, email: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
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
