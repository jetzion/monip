import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";
import { autosaveDrafts, livePreview } from "../lib/live-preview";

/** Fixed site pages. Each key maps to a route defined in code. */
export const PAGE_KEYS = [
  { label: "About (/about)", value: "about" },
  { label: "Products (/products)", value: "products" },
  { label: "Services (/services)", value: "services" },
  { label: "Our clients (/clients)", value: "clients" },
  { label: "Success Stories (/success-stories)", value: "success-stories" },
  { label: "Privacy policy (/privacy)", value: "privacy" },
] as const;

export type PageKey = (typeof PAGE_KEYS)[number]["value"];

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "key", "_status", "updatedAt"],
    description:
      "About, Products, Services, Our clients, Success Stories, and Privacy pages. A page and its link appear on the site only once published (Products and Services work without an entry; when present, it sets their title, headline, and intro).",
    livePreview: livePreview((data) => (typeof data.key === "string" ? `/${data.key}` : null)),
  },
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
    { name: "title", type: "text", required: true },
    {
      name: "headline",
      type: "text",
      admin: {
        description:
          "Optional large heading, e.g. Turning Ideas Into Results. When set, the title becomes the small label above it.",
      },
    },
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
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional photo shown below the introduction. Also used when the page is shared.",
      },
    },
    { name: "body", type: "richText" },
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
