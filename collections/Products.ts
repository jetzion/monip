import type { CollectionBeforeChangeHook, CollectionConfig, Where } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { slugField } from "../fields/slug";
import { autosaveDrafts, livePreview } from "../lib/live-preview";
import { revalidateDeletedProduct, revalidateProduct } from "../hooks/revalidate";

/** Records the first publish time; later publishes keep it. */
const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data._status === "published" && !data.publishedAt && !originalDoc?.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() };
  }
  return data;
};

const listField = (name: string, label: string, description: string) => ({
  name,
  label,
  type: "text" as const,
  hasMany: true,
  admin: { description },
});

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "featured", "_status", "updatedAt"],
    description:
      "Product samples shown in the public catalog. Only published products are visible on the site.",
    livePreview: livePreview((data) => (data.slug ? `/products/${data.slug}` : null)),
  },
  versions: autosaveDrafts,
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  hooks: {
    beforeChange: [setPublishedAt],
    afterChange: [revalidateProduct],
    afterDelete: [revalidateDeletedProduct],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField("name"),
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show this product in featured sections on the homepage.",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        description: "Set automatically on first publish.",
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
              maxLength: 200,
              admin: { description: "One or two sentences shown on product cards." },
            },
            {
              name: "description",
              type: "richText",
            },
            {
              name: "primaryImage",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: { description: "Main image used on cards and at the top of the page." },
            },
            {
              name: "gallery",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              admin: { description: "Additional images. Drag to reorder." },
            },
          ],
        },
        {
          label: "Details",
          fields: [
            {
              name: "category",
              type: "relationship",
              relationTo: "categories",
              required: true,
              filterOptions: { parent: { exists: false } },
            },
            {
              name: "subcategory",
              type: "relationship",
              relationTo: "categories",
              admin: {
                description: "Optional. Must belong to the selected category.",
                condition: (_, siblingData) => Boolean(siblingData?.category),
              },
              filterOptions: ({ siblingData }): Where => ({
                parent: { equals: (siblingData as { category?: number })?.category },
              }),
            },
            listField("tags", "Tags", "Keywords used for search."),
            listField("materials", "Materials", "For example: stainless steel, recycled PET."),
            listField(
              "customizationOptions",
              "Customization options",
              "For example: laser engraving, full-color print.",
            ),
            listField("applications", "Industries / applications", "Markets or uses."),
            {
              name: "labels",
              type: "select",
              hasMany: true,
              options: [
                { label: "New", value: "new" },
                { label: "Sustainable", value: "sustainable" },
              ],
              admin: { description: "Only apply a label when it is accurate and approved." },
            },
            {
              name: "specifications",
              type: "array",
              labels: { singular: "Specification", plural: "Specifications" },
              admin: { description: "Public specifications only, e.g. Dimensions: 10 x 8 cm." },
              fields: [
                { name: "label", type: "text", required: true },
                { name: "value", type: "text", required: true },
              ],
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
                {
                  name: "title",
                  type: "text",
                  admin: { description: "Defaults to the product name." },
                },
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
