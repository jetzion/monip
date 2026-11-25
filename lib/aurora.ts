import type { CSSProperties } from "react";

export type SectionColors = {
  base?: string | null;
  clouds?: string | null;
  highlights?: string | null;
};

/** CSS variables for an aurora band (globals.css) from the editor's colours; unset colours keep the band's shade. */
export function auroraStyle(colors: SectionColors | null | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (colors?.base) vars["--aurora-base"] = colors.base;
  if (colors?.clouds) for (const n of [1, 2, 3, 4]) vars[`--aurora-${n}`] = colors.clouds;
  if (colors?.highlights) for (const n of [5, 6, 7]) vars[`--aurora-${n}`] = colors.highlights;
  return vars as CSSProperties;
}
