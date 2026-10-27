import type { CollectionConfig, Condition } from "payload";

import { isAdmin } from "../access/roles";
import { scheduleSession } from "../lib/training/hooks";
import { DURATIONS, TRAINING_TYPES } from "../lib/training/schedule";

const dayOnly = { date: { pickerAppearance: "dayOnly" as const, displayFormat: "d MMM yyyy" } };
const dayAndTime = { date: { pickerAppearance: "dayAndTime" as const, displayFormat: "d MMM yyyy HH:mm" } };
const isOnline: Condition = (data) => data?.type === "online";
const copied = { readOnly: true };
const inYourZone = {
  readOnly: true,
  description: "Set on save. Shown in your computer's time zone; the calendar uses the session's own.",
};

/**
 * Product training for cruise personnel, one cruise and one trainer per
 * session. Start and end are worked out on save (see lib/training) and stored
 * in UTC with the session's time zone. Admin only.
 */
export const TrainingSessions: CollectionConfig = {
  slug: "training-sessions",
  labels: { singular: "Training session", plural: "Training Schedule" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "endsAt", "timeZone"],
    description: "Product training scheduled on cruises. Admins only.",
    components: {
      views: { list: { Component: "/components/admin/TrainingListView#TrainingListView" } },
    },
  },
  defaultSort: "startsAt",
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [scheduleSession],
  },
  fields: [
    { name: "title", type: "text", admin: { hidden: true } },
    {
      name: "cruise",
      type: "relationship",
      relationTo: "cruise-sailings",
      admin: { description: "One cruise from the Cruise Fleet Schedule (required)." },
    },
    {
      type: "row",
      fields: [
        { name: "trainer", type: "relationship", relationTo: "trainers", required: true },
        { name: "type", label: "Training type", type: "select", required: true, options: [...TRAINING_TYPES] },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "date", label: "Date", type: "date", admin: { ...dayOnly, condition: isOnline } },
        {
          name: "startTime",
          label: "Start time",
          type: "text",
          admin: { condition: isOnline, placeholder: "09:00", description: "24-hour HH:MM." },
        },
        {
          name: "timeZone",
          label: "Time zone",
          type: "text",
          admin: {
            condition: isOnline,
            placeholder: "America/New_York",
            description: "Departure day and onboarding use the start port's time zone.",
          },
        },
        {
          name: "durationHours",
          label: "Duration (hours)",
          type: "select",
          options: DURATIONS.map((hours) => ({ label: `${hours} hours`, value: hours })),
          admin: { condition: isOnline },
        },
      ],
    },
    {
      name: "endDate",
      label: "End date",
      type: "date",
      admin: {
        ...dayOnly,
        condition: (data) => data?.type === "onboarding",
        description: "Defaults to the cruise's end date.",
      },
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        { name: "startsAt", label: "Starts", type: "date", index: true, admin: { ...dayAndTime, ...inYourZone } },
        { name: "endsAt", label: "Ends", type: "date", index: true, admin: { ...dayAndTime, ...inYourZone } },
      ],
    },
    {
      name: "cruiseCopy",
      label: "Cruise when scheduled",
      type: "group",
      admin: {
        position: "sidebar",
        description: "Copied on save, so the session stays readable if the cruise changes or is removed.",
      },
      fields: [
        { name: "ship", type: "text", admin: copied },
        { name: "cruiseLine", label: "Cruise line", type: "text", admin: copied },
        { name: "startDate", label: "Start date", type: "date", admin: { ...copied, ...dayOnly } },
        { name: "endDate", label: "End date", type: "date", admin: { ...copied, ...dayOnly } },
        { name: "startPort", label: "Start port", type: "text", admin: copied },
        { name: "arrival", type: "text", admin: copied },
        { name: "departure", type: "text", admin: copied },
      ],
    },
  ],
};
