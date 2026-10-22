import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";

/**
 * Inquiries contain personal information. Only the server-side form
 * handler creates them (via the Local API); only admins can read them.
 */
export const Inquiries: CollectionConfig = {
  slug: "inquiries",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "productName", "emailStatus", "createdAt"],
    description: "Website inquiries. Read-only record of what was submitted.",
  },
  defaultSort: "-createdAt",
  access: {
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Product inquiry", value: "product" },
        { label: "General inquiry", value: "general" },
      ],
      admin: { readOnly: true },
    },
    { name: "name", type: "text", required: true, admin: { readOnly: true } },
    { name: "email", type: "email", required: true, admin: { readOnly: true } },
    { name: "company", type: "text", admin: { readOnly: true } },
    { name: "phone", type: "text", admin: { readOnly: true } },
    { name: "message", type: "textarea", required: true, admin: { readOnly: true } },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "productName",
      type: "text",
      admin: { readOnly: true, position: "sidebar", description: "Captured at submission time." },
    },
    {
      name: "productUrl",
      type: "text",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "emailStatus",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Whether the notification email to MONIP was accepted.",
      },
    },
  ],
};
