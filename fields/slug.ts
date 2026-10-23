import type { FieldHook, TextField } from "payload";

import { toSlug } from "../lib/slug";

/** On duplicate, picks the first free slug: `x-copy`, `x-copy-2`, ... */
const nextCopySlug: FieldHook = async ({ value, req, collection }) => {
  if (typeof value !== "string" || !collection) return value;
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? `${value}-copy` : `${value}-copy-${n}`;
    const { totalDocs } = await req.payload.count({
      collection: collection.slug,
      where: { slug: { equals: candidate } },
      req,
    });
    if (totalDocs === 0) return candidate;
  }
};

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
    beforeDuplicate: [nextCopySlug],
  },
});
