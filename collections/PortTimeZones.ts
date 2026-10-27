import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { isAdmin } from "../access/roles";
import { isTimeZone } from "../lib/training/time";

const validTimeZone: TextFieldSingleValidation = (value) =>
  !value || isTimeZone(value) || 'Use a time zone name such as "America/New_York" or "Europe/Rome".';

/**
 * Time zone of each cruise start port, used for departure-day and onboarding
 * training. Port names match the Cruise Fleet Schedule exactly. Admin only.
 */
export const PortTimeZones: CollectionConfig = {
  slug: "port-time-zones",
  labels: { singular: "Port time zone", plural: "Port time zones" },
  admin: {
    useAsTitle: "port",
    defaultColumns: ["port", "timeZone"],
    description:
      "Time zone of each start port, used by the Training Schedule. The port must be spelled exactly as in the Cruise Fleet Schedule.",
  },
  defaultSort: "port",
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "port",
          label: "Start port",
          type: "text",
          required: true,
          unique: true,
          admin: { description: 'Exactly as in the Cruise Fleet Schedule, for example "Miami, Florida".' },
        },
        {
          name: "timeZone",
          label: "Time zone",
          type: "text",
          required: true,
          validate: validTimeZone,
          admin: { description: 'For example "America/New_York". Search "IANA time zone" plus the city.' },
        },
      ],
    },
  ],
};
