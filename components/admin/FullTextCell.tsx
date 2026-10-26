import type { DefaultCellComponentProps } from "payload";

/**
 * List cell that shows the whole value. Payload's textarea cell cuts it at
 * 100 characters, and list styles clamp a cell's span to 4 lines, so this
 * renders the full text in a div.
 */
export function FullTextCell({ cellData }: DefaultCellComponentProps) {
  return <div>{typeof cellData === "string" ? cellData : ""}</div>;
}
