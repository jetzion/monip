"use client";

import { DefaultCell } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { initialsOf } from "@/lib/admin/initials";

/**
 * A trainer's First name in the list with their initials badge, as on the
 * training report. Payload's own cell keeps the link to the trainer.
 */
export function TrainerNameCell(props: DefaultCellComponentProps) {
  const row = props.rowData as { firstName?: string | null; lastName?: string | null };
  return (
    <span className="trainer-cell">
      <span className="trainer-cell__initials" aria-hidden="true">
        {initialsOf(row.firstName, row.lastName)}
      </span>
      <DefaultCell {...props} />
    </span>
  );
}
