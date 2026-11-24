import type { CollectionConfig, NumberField, TextFieldSingleValidation } from "payload";

import { editTabsHiddenFromTrainers, isAdmin, isAdminField, isTraining } from "../access/roles";
import { isTimeZone } from "../lib/training/time";

const validTimeZone: TextFieldSingleValidation = (value) =>
  !value || isTimeZone(value) || 'Use a time zone name such as "America/New_York" or "Europe/Rome".';

/** An optional US dollar rate for travel estimates at this port. */
const rate = (name: string, label: string, description: string): NumberField => ({
  name,
  label,
  type: "number",
  min: 0,
  admin: { step: 1, description, components: { Cell: "/components/admin/RateCell#RateCell" } },
});

/**
 * Time zone of each cruise start port, used for departure-day and onboarding
 * training, with optional travel rates for this port. Port names match the
 * Cruise Fleet Schedule exactly. Admins manage ports; admins and trainers set
 * the rates.
 */
export const PortTimeZones: CollectionConfig = {
  slug: "port-time-zones",
  labels: { singular: "Port time zone", plural: "Port time zones" },
  admin: {
    group: "Training",
    components: { views: { edit: editTabsHiddenFromTrainers }, beforeList: ["/components/admin/TrainingNav#TrainingNavBeforeList"] },
    useAsTitle: "port",
    defaultColumns: ["port", "timeZone", "flightFare", "hotelPerNight", "rideshareFare"],
    description:
      "Time zone of each start port, used by the Training Schedule, and optional travel rates for estimates (empty rates use the defaults in Training planning costs). The port must be spelled exactly as in the Cruise Fleet Schedule.",
  },
  defaultSort: "port",
  access: {
    read: isTraining,
    create: isAdmin,
    // Trainers update the rates only; the port and time zone are admin fields.
    update: isTraining,
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
          access: { update: isAdminField },
          admin: { description: 'Exactly as in the Cruise Fleet Schedule, for example "Miami, Florida".' },
        },
        {
          name: "timeZone",
          label: "Time zone",
          type: "text",
          required: true,
          validate: validTimeZone,
          access: { update: isAdminField },
          admin: { description: 'For example "America/New_York". Search "IANA time zone" plus the city.', components: { Cell: "/components/admin/TimeZoneCell#TimeZoneCell" } },
        },
      ],
    },
    {
      type: "row",
      fields: [
        rate("flightFare", "Flight fare (USD)", "Typical return fare to this port. Empty: the default Travel, per trip."),
        rate("hotelPerNight", "Hotel per night (USD)", "Typical hotel near the port. Empty: the default Hotel, per night."),
        rate("rideshareFare", "Rideshare fare (USD)", "One way between the airport and the port. Empty: the default rideshare fare."),
      ],
    },
  ],
};
