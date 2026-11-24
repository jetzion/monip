import type { DefaultCellComponentProps } from "payload";

import { usd } from "@/lib/training/estimate";

/** A port's travel rate in the list, or "Default" when empty (Training planning costs applies). */
export function RateCell({ cellData }: DefaultCellComponentProps) {
  return typeof cellData === "number" ? <span>{usd(cellData)}</span> : <span className="rate-cell--default">Default</span>;
}
