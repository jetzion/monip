import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { autosaveDrafts, livePreview } from "../lib/live-preview";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";

export const Offices: CollectionConfig = {
  slug: "offices",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "sortOrder", "_status", "updatedAt"],
    description: "Offices shown on the About page map and list.",
    livePreview: livePreview(() => "/about"),
  },
  defaultSort: "sortOrder",
  versions: autosaveDrafts,
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateSiteOnDelete],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: 'Shown on the map and in the list, for example "Hong Kong".' },
    },
    {
      name: "address",
      type: "textarea",
      maxLength: 300,
      admin: { description: "Optional street address shown in the list." },
    },
    {
      type: "row",
      fields: [
        {
          name: "latitude",
          type: "number",
          required: true,
          min: -58,
          max: 84,
          admin: {
            description: "Map position. In Google Maps, right-click the place and click the numbers to copy them; the first is latitude.",
          },
        },
        {
          name: "longitude",
          type: "number",
          required: true,
          min: -180,
          max: 180,
          admin: { description: "The second number." },
        },
      ],
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", description: "Lower numbers appear first in the list." },
    },
  ],
};
