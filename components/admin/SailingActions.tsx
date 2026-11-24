import { Button } from "@payloadcms/ui";
import type { BeforeListTableServerProps } from "payload";

import { SailingImportButton } from "./SailingImportButton";

/** Download Excel Template and Import Excel actions above the sailings list (admins only). */
export function SailingActions({ payload, user }: BeforeListTableServerProps) {
  // Trainers view the schedule only.
  if (user?.role !== "admin") return null;
  const base = `${payload.config.routes.api}/cruise-sailings`;
  return (
    <div className="sailing-actions">
      <Button el="anchor" url={`${base}/template`} buttonStyle="secondary" size="medium">
        Download Excel Template
      </Button>
      <SailingImportButton endpoint={`${base}/import`} />
    </div>
  );
}
