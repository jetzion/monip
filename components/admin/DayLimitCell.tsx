import type { DefaultCellComponentProps } from "payload";

/** A trainer's monthly day limit in the list, or "No limit" when empty. */
export function DayLimitCell({ cellData }: DefaultCellComponentProps) {
  return typeof cellData === "number" ? <span>{cellData}</span> : <span className="day-limit--none">No limit</span>;
}
