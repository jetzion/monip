import type { CollectionConfig, Condition } from "payload";

import { editTabsHiddenFromTrainers, isTraining } from "../access/roles";
import { scheduleSession } from "../lib/training/hooks";
import { canDeleteSession, guardStartedSession } from "../lib/training/session-rules";
import { reportEndpoint } from "../lib/training/report-endpoint";
import { priceLookupEndpoint } from "../lib/training/price-endpoint";
import { DURATIONS, TRAINING_TYPES } from "../lib/training/schedule";

const dayOnly = { date: { pickerAppearance: "dayOnly" as const, displayFormat: "d MMM yyyy" } };
const dayAndTime = { date: { pickerAppearance: "dayAndTime" as const, displayFormat: "d MMM yyyy HH:mm" } };
const isOnline: Condition = (data) => data?.type === "online";
const isInPerson: Condition = (data) => data?.type === "departureDay" || data?.type === "onboarding";
const withAir: Condition = (_, siblingData) => Boolean(siblingData?.airTravel);
const withHotel: Condition = (_, siblingData) => Boolean(siblingData?.hotel);
const withCar: Condition = (_, siblingData) => Boolean(siblingData?.carRental);
const copied = { readOnly: true };
const inYourZone = {
  readOnly: true,
  description: "Set on save. Shown in your computer's time zone; the calendar uses the session's own.",
};

/**
 * Product training for cruise personnel, one cruise and one trainer per
 * session. Start and end are worked out on save (see lib/training) and stored
 * in UTC with the session's time zone. Admins and trainers only; trainers
 * cannot edit or delete a session once it has started, only cancel it.
 */
export const TrainingSessions: CollectionConfig = {
  slug: "training-sessions",
  labels: { singular: "Training session", plural: "Training Schedule" },
  admin: {
    group: "Training",
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "endsAt", "timeZone"],
    description: "Product training scheduled on cruises. Admins and trainers only.",
    components: {
      views: { list: { Component: "/components/admin/TrainingListView#TrainingListView" }, edit: editTabsHiddenFromTrainers },
    },
  },
  defaultSort: "startsAt",
  endpoints: [reportEndpoint, priceLookupEndpoint],
  access: {
    read: isTraining,
    create: isTraining,
    update: isTraining,
    delete: canDeleteSession,
  },
  hooks: {
    beforeValidate: [guardStartedSession, scheduleSession],
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
      name: "travel",
      label: "Travel",
      type: "group",
      admin: {
        condition: isInPerson,
        description:
          "The trainer's trip, for in-person training away from their home base. The trip days block the trainer from other sessions. To estimate its cost, add or change the trip in the session's details on the Training Schedule.",
      },
      fields: [
        { name: "departureCity", label: "Departure city", type: "text" },
        {
          type: "row",
          fields: [
            { name: "departureDate", label: "Departure date", type: "date", admin: dayOnly },
            { name: "returnDate", label: "Return date", type: "date", admin: dayOnly },
          ],
        },
        { name: "airTravel", label: "Air travel needed", type: "checkbox", defaultValue: false },
        {
          type: "row",
          fields: [
            { name: "departureAirport", label: "Departing airport", type: "text", admin: { condition: withAir } },
            { name: "destinationAirport", label: "Destination airport", type: "text", admin: { condition: withAir } },
            {
              name: "returnAirport",
              label: "Return from airport",
              type: "text",
              admin: { condition: withAir, description: "When flying home from another airport (a cruise ending elsewhere)." },
            },
          ],
        },
        { name: "hotel", label: "Hotel needed", type: "checkbox", defaultValue: false },
        {
          type: "row",
          fields: [
            { name: "hotelCheckIn", label: "Hotel check-in", type: "date", admin: { ...dayOnly, condition: withHotel } },
            { name: "hotelCheckOut", label: "Hotel check-out", type: "date", admin: { ...dayOnly, condition: withHotel } },
          ],
        },
        { name: "carRental", label: "Car rental needed", type: "checkbox", defaultValue: false },
        {
          type: "row",
          fields: [
            { name: "carPickUp", label: "Car pick-up", type: "date", admin: { ...dayOnly, condition: withCar } },
            { name: "carReturn", label: "Car return", type: "date", admin: { ...dayOnly, condition: withCar } },
          ],
        },
        { name: "rideshare", label: "Rideshare needed", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "estimate",
      label: "Travel cost estimate",
      type: "group",
      admin: {
        condition: isInPerson,
        readOnly: true,
        description:
          "Made and acknowledged on the Training Schedule (Estimate cost). A change to the trip, port, or times needs a new estimate.",
      },
      fields: [
        {
          name: "lines",
          type: "array",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "item",
                  type: "select",
                  options: [
                    { label: "Flight", value: "flight" },
                    { label: "Hotel", value: "hotel" },
                    { label: "Car rental", value: "carRental" },
                    { label: "Rideshare", value: "rideshare" },
                  ],
                },
                { name: "label", type: "text" },
                { name: "detail", type: "text" },
                { name: "amount", label: "Amount (USD)", type: "number", min: 0 },
                { name: "source", type: "text" },
              ],
            },
            { name: "url", label: "Price found at", type: "text" },
            { name: "note", type: "textarea" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "total", label: "Total (USD)", type: "number" },
            { name: "acknowledgedAt", label: "Acknowledged", type: "date", admin: dayAndTime },
            { name: "acknowledgedBy", label: "Acknowledged by", type: "text" },
          ],
        },
        // The trip, port, and times the estimate was made for (see lib/training/estimate.ts).
        { name: "acknowledgedFor", type: "textarea", admin: { hidden: true } },
      ],
    },
    {
      name: "canceled",
      label: "Canceled",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: {
        position: "sidebar",
        description: "The session did not or will not take place. It stays in the calendar and report (not in totals) and no longer blocks the trainer. Untick to restore it.",
      },
    },
    {
      name: "fixed",
      label: "Fixed",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "The training planner never suggests moving a fixed session, for example when travel is booked.",
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
    // When the trainer is busy, travel days included; used for conflicts.
    { name: "blockedFrom", type: "date", index: true, admin: { hidden: true } },
    { name: "blockedTo", type: "date", index: true, admin: { hidden: true } },
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
