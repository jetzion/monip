import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { slugField } from "../fields/slug";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";
import { autosaveDrafts, livePreview } from "../lib/live-preview";

export const SuccessStories: CollectionConfig = {
  slug: "success-stories",
  labels: { singular: "Success story", plural: "Success stories" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["featuredImage", "title", "industry", "_status", "updatedAt"],
    description:
      "Stories shown on the Success Stories page, in this order. Drag the handle on the left to reorder. Only published stories are visible on the site.",
    livePreview: livePreview((data) => (data.slug ? `/success-stories/${data.slug}` : null)),
  },
  // Drag-and-drop ordering in the list; adds a hidden `_order` field.
  orderable: true,
  defaultSort: "_order",
  versions: autosaveDrafts,
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  // Stories change the navigation (shown only when one is published), so refresh every page.
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateSiteOnDelete],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      hooks: { beforeDuplicate: [({ value }) => (typeof value === "string" ? `${value} (copy)` : value)] },
    },
    slugField("title"),
    {
      name: "publicationDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly" },
        description: "Optional. Shown on the story card and page.",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "summary",
              type: "textarea",
              required: true,
              maxLength: 240,
              admin: { description: "Two or three sentences shown on the story card and under the title." },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: { description: "Approved project photo used on the card and at the top of the page." },
            },
            {
              name: "body",
              type: "richText",
              admin: {
                description: "The full story, for example: the challenge, the solution, and the result.",
              },
            },
            {
              name: "gallery",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              admin: { description: "Additional approved project photos. Drag to reorder." },
            },
          ],
        },
        {
          label: "Details",
          fields: [
            {
              name: "industry",
              label: "Industry or project category",
              type: "text",
              admin: { description: "Optional, for example: Hospitality, Retail, Corporate events." },
            },
            {
              name: "customerName",
              type: "text",
              admin: { description: "Optional. Shown only when the approval box below is ticked." },
            },
            {
              name: "customerApproved",
              label: "Customer approved for public display",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Tick only when MONIP has written approval to name this customer.",
                condition: (_, siblingData) => Boolean(siblingData?.customerName),
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "seo",
              type: "group",
              label: false,
              fields: [
                { name: "title", type: "text", admin: { description: "Defaults to the story title." } },
                {
                  name: "description",
                  type: "textarea",
                  maxLength: 160,
                  admin: { description: "Defaults to the summary." },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
