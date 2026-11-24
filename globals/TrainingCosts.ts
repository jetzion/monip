import type { GlobalConfig, NumberField } from "payload";

import { editTabsHiddenFromTrainers, hiddenFromTrainers, isTraining } from "../access/roles";

/** A US dollar amount, shown with "$" and at its share of the row (`width`). */
const amount = (name: string, label: string, description: string, width: string): NumberField => ({
  name,
  label,
  type: "number",
  min: 0,
  admin: { step: 1, width, description, components: { beforeInput: ["/components/admin/DollarPrefix#DollarPrefix"] } },
});

/**
 * Cost estimates used by the training planner to compare plans, and the
 * default rates for travel estimates (ports can override flight, hotel, and
 * rideshare). All optional: while empty, plans are compared by format and
 * travel instead. Admins and trainers only.
 */
export const TrainingCosts: GlobalConfig = {
  slug: "training-costs",
  label: "Training planning costs",
  admin: {
    group: "Training",
    components: {
      views: { edit: editTabsHiddenFromTrainers },
      elements: { Description: "/components/admin/TrainingNav#TrainingNavDescription" },
    },
    // Not in trainers' navigation (decided 2026-11-24).
    hidden: hiddenFromTrainers,
    description:
      "Estimated costs in US dollars, used by the training planner to compare plans and as default rates for travel estimates (Port time zones can set flight, hotel, and rideshare rates per port). Leave a value empty while it is unknown. Admins and trainers only.",
  },
  access: {
    read: isTraining,
    update: isTraining,
  },
  // Two sections (layout only: the stored fields are unchanged).
  fields: [
    {
      type: "collapsible",
      label: "Training sessions (without travel)",
      fields: [
        {
          type: "row",
          fields: [
            amount("onlineSession", "Online session", "Cost of one online session.", "33%"),
            amount("departureDaySession", "Departure-day session", "Cost of one departure-day session, without travel.", "33%"),
            amount("onboardingDay", "Onboarding, per day", "Cost of each day a trainer spends on board, without travel.", "33%"),
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Travel defaults (for ports without their own rate)",
      fields: [
        {
          type: "row",
          fields: [
            amount(
              "trip",
              "Travel, per trip",
              "A return trip to a port that is not the trainer's home base. Also the default flight fare in travel estimates.",
              "50%",
            ),
            amount(
              "night",
              "Hotel, per night",
              "Each night away from home base that is not spent on board. Also the default hotel rate in travel estimates.",
              "50%",
            ),
          ],
        },
        {
          type: "row",
          fields: [
            amount("carRentalPerDay", "Car rental, per day", "Default daily car rental rate in travel estimates.", "50%"),
            amount("rideshareFare", "Rideshare, per trip", "Default one-way rideshare fare between the airport and the port in travel estimates.", "50%"),
          ],
        },
      ],
    },
  ],
};
