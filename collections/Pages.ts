import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";

/** Fixed site pages. Each key maps to a route defined in code. */
export const PAGE_KEYS = [
  { label: "About (/about)", value: "about" },
  { label: "Sustainability (/sustainability)", value: "sustainability" },
  { label: "Privacy policy (/privacy)", value: "privacy" },
] as const;

export type PageKey = (typeof PAGE_KEYS)[number]["value"];

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "key", "_status", "updatedAt"],
    description:
      "About, Sustainability, and Privacy pages. A page and its link appear on the site only once published.",
  },
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
    {
      name: "key",
      label: "Page",
      type: "select",
      required: true,
      unique: true,
      options: [...PAGE_KEYS],
      admin: { position: "sidebar", description: "Which site page this content is for." },
    },
    {
      name: "intro",
      type: "textarea",
      maxLength: 400,
      admin: { description: "Short introduction shown under the page title." },
    },
    {
      name: "body",
      type: "richText",
      admin: {
        description:
          "Sustainability: publish only claims MONIP can substantiate (materials, programs, certifications).",
      },
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        { name: "title", type: "text", admin: { description: "Defaults to the page title." } },
        { name: "description", type: "textarea", maxLength: 160 },
      ],
    },
  ],
};
