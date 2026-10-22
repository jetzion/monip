import type { CollectionConfig, Where } from "payload";

import { isLoggedIn } from "../access/content";
import { slugField } from "../fields/slug";
import { revalidateCategories, revalidateDeletedCategory } from "../hooks/revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "parent", "sortOrder"],
    description:
      "Product categories. Set a parent to make a subcategory (two levels max).",
  },
  defaultSort: "sortOrder",
  hooks: {
    afterChange: [revalidateCategories],
    afterDelete: [revalidateDeletedCategory],
  },
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField(),
    {
      name: "parent",
      type: "relationship",
      relationTo: "categories",
      admin: {
        position: "sidebar",
        description: "Leave empty for a top-level category.",
      },
      filterOptions: ({ id }): Where => {
        const topLevel: Where = { parent: { exists: false } };
        // `id` is undefined on create; only exclude self when editing.
        return id ? { and: [topLevel, { id: { not_equals: id } }] } : topLevel;
      },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first.",
      },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        {
          name: "title",
          type: "text",
          admin: { description: "Defaults to the category title." },
        },
        {
          name: "description",
          type: "textarea",
          maxLength: 160,
        },
      ],
    },
  ],
};
