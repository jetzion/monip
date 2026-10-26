import { Button } from "@payloadcms/ui";
import type { BeforeListTableServerProps } from "payload";

/** Downloads the blank Excel template for importing sailings. */
export function SailingTemplateButton({ payload }: BeforeListTableServerProps) {
  return (
    <div className="sailing-template">
      <Button el="anchor" url={`${payload.config.routes.api}/cruise-sailings/template`} buttonStyle="secondary" size="medium">
        Download Excel Template
      </Button>
    </div>
  );
}
