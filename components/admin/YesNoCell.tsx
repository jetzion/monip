import type { DefaultCellComponentProps } from "payload";

/** A checkbox in a list as a Yes or No pill, instead of Payload's "true" or "false". */
export function YesNoCell({ cellData }: DefaultCellComponentProps) {
  return cellData ? <span className="yes-no yes-no--yes">Yes</span> : <span className="yes-no yes-no--no">No</span>;
}
