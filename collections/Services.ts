import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { slugField } from "../fields/slug";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";

export const Services: CollectionConfig = {
  slug: "services",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "sortOrder", "_status", "updatedAt"],
    description:
      "Services shown on the Services page. The page and its menu link appear once at least one service is published.",
  },
  defaultSort: "sortOrder",
  versions: { drafts: true },
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
    { name: "title", type: "text", required: true },
    slugField(),
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", description: "Lower numbers appear first." },
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: { description: "A short description shown at the top of the service section." },
    },
    { name: "body", type: "richText" },
    { name: "image", type: "upload", relationTo: "media" },
  ],
};
