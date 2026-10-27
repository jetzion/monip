"use client";

import { CheckboxInput, useListQuery, useTableColumns } from "@payloadcms/ui";
import { transformColumnsToSearchParams } from "payload/shared";

const COLUMNS = ["portsInOrder", "source"];

/**
 * Hides or shows the long Ports in order and Source columns together.
 * Uses Payload's column state, so it matches the Columns menu and is
 * remembered per admin like any other column choice.
 */
export function HideItineraryColumns() {
  const { columns = [] } = useTableColumns();
  const { refineListData } = useListQuery();
  const targets = columns.filter((column) => COLUMNS.includes(column.accessor));
  const hidden = targets.length > 0 && targets.every((column) => !column.active);

  const setHidden = (hide: boolean) =>
    refineListData({
      columns: transformColumnsToSearchParams(
        columns.map((column) => (COLUMNS.includes(column.accessor) ? { ...column, active: !hide } : column)),
      ),
    });

  return (
    <CheckboxInput
      id="sailing-hide-itinerary"
      className="sailing-filters__toggle"
      label="Hide Ports in order and Source"
      checked={hidden}
      onToggle={(event) => setHidden(event.target.checked)}
    />
  );
}
