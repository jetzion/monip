import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";
import { templateEndpoint } from "../lib/sailings/template-endpoint";

const fullTextCell = "/components/admin/FullTextCell#FullTextCell";

const dayOnly = { date: { pickerAppearance: "dayOnly" as const, displayFormat: "d MMM yyyy" } };

/**
 * Cruise sailings imported from the fleet calendar workbook (Sailings sheet).
 * Admin only: operator data is commercially sensitive and never public.
 * Ship + Start date identifies a sailing; re-imports match on it.
 */
export const CruiseSailings: CollectionConfig = {
  slug: "cruise-sailings",
  labels: { singular: "Sailing", plural: "Cruise Fleet Schedule" },
  admin: {
    useAsTitle: "ship",
    defaultColumns: [
      "cruiseLine",
      "ship",
      "operator",
      "startDate",
      "endDate",
      "nights",
      "startPort",
      "endPort",
      "portsInOrder",
      "confidence",
      "source",
      "arrival",
      "departure",
    ],
    description: "Cruise sailings imported from the fleet calendar workbook. Admins only.",
    pagination: { defaultLimit: 25, limits: [25, 50, 100] },
    components: {
      beforeListTable: [
        "/components/admin/SailingTemplateButton#SailingTemplateButton",
        "/components/admin/SailingFilters#SailingFilters",
      ],
    },
  },
  defaultSort: ["startDate", "cruiseLine", "ship"],
  endpoints: [templateEndpoint],
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  indexes: [{ fields: ["ship", "startDate"], unique: true }],
  fields: [
    {
      type: "row",
      fields: [
        { name: "cruiseLine", label: "Cruise line", type: "text", required: true, index: true },
        { name: "ship", label: "Ship", type: "text", required: true, index: true },
        { name: "operator", label: "Operator", type: "text", index: true },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "startDate", label: "Start date", type: "date", required: true, index: true, admin: dayOnly },
        { name: "endDate", label: "End date", type: "date", index: true, admin: dayOnly },
        { name: "nights", label: "Nights", type: "number", min: 0, admin: { step: 1 } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "startPort", label: "Start port", type: "text", index: true },
        { name: "endPort", label: "End port", type: "text" },
      ],
    },
    {
      name: "portsInOrder",
      label: "Ports in order",
      type: "textarea",
      admin: {
        description: 'Itinerary as in the workbook, for example "Miami, Florida → At sea → …".',
        components: { Cell: fullTextCell },
      },
    },
    {
      type: "row",
      fields: [
        { name: "confidence", label: "Confidence", type: "text" },
        {
          name: "source",
          label: "Source",
          type: "textarea",
          admin: { description: "Usually a URL.", components: { Cell: fullTextCell } },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "arrival",
          label: "Arrival",
          type: "text",
          admin: { description: "Ship's arrival time at the start port on embarkation day (HH:MM)." },
        },
        {
          name: "departure",
          label: "Departure",
          type: "text",
          admin: { description: "Ship's departure time from the start port on embarkation day (HH:MM)." },
        },
      ],
    },
  ],
};
