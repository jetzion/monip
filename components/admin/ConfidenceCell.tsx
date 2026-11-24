import type { DefaultCellComponentProps } from "payload";

import { confidenceTone } from "@/lib/sailings/confidence";

/** A sailing's Confidence as a coloured pill; the text is shown as stored. */
export function ConfidenceCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "string" || !cellData.trim()) return null;
  return <span className={`confidence-pill confidence-pill--${confidenceTone(cellData)}`}>{cellData}</span>;
}
