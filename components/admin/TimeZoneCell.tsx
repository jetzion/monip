import type { DefaultCellComponentProps } from "payload";

import { isTimeZone, utcOffsetLabel } from "@/lib/training/time";

/** A port's time zone in the list with its offset from UTC today ("Europe/Amsterdam · UTC+1"). */
export function TimeZoneCell({ cellData }: DefaultCellComponentProps) {
  if (!isTimeZone(cellData)) return <span>{typeof cellData === "string" ? cellData : ""}</span>;
  return (
    <span className="time-zone-cell">
      {cellData}
      <span className="time-zone-cell__offset">{utcOffsetLabel(cellData, new Date())}</span>
    </span>
  );
}
