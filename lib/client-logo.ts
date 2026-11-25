import type { Media } from "@/payload-types";

/**
 * Display height so wide and tall logos look about equally large: at scale 1 a
 * 3:1 logo is 46px tall, wider ones shorter, taller ones taller (capped at 88px).
 */
export function logoHeight(logo: Media | null, scale = 1) {
  if (!logo?.width || !logo.height) return Math.round(88 * scale);
  const ratio = logo.width / logo.height;
  return Math.round(Math.min(88, 46 * (ratio / 3) ** -0.6) * scale);
}
