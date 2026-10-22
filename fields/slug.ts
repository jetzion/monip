import type { TextField } from "payload";

import { toSlug } from "../lib/slug";

/**
 * Unique URL slug. Filled from `sourceField` when left empty; never
 * regenerated afterwards, so published URLs stay stable.
 */
export const slugField = (sourceField = "title"): TextField => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description:
      "Used in the page URL. Leave empty to generate from the name. Changing it later breaks existing links.",
  },
  hooks: {
    beforeValidate: [
      ({ value, siblingData }) => {
        const source = value || siblingData?.[sourceField];
        return typeof source === "string" ? toSlug(source) : value;
      },
    ],
  },
});
