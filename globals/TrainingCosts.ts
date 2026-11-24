import type { GlobalConfig, NumberField } from "payload";

import { editTabsHiddenFromTrainers, hiddenFromTrainers, isTraining } from "../access/roles";

const amount = (name: string, label: string, description: string): NumberField => ({
  name,
  label,
  type: "number",
  min: 0,
  admin: { step: 1, description },
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
    components: { views: { edit: editTabsHiddenFromTrainers } },
    // Not in trainers' navigation (decided 2026-11-24).
    hidden: hiddenFromTrainers,
    description:
      "Estimated costs in US dollars, used by the training planner to compare plans and as default rates for travel estimates (Port time zones can set flight, hotel, and rideshare rates per port). Leave a value empty while it is unknown. Admins and trainers only.",
  },
  access: {
    read: isTraining,
    update: isTraining,
  },
  fields: [
    {
      type: "row",
      fields: [
        amount("onlineSession", "Online session", "Cost of one online session."),
        amount("departureDaySession", "Departure-day session", "Cost of one departure-day session, without travel."),
        amount("onboardingDay", "Onboarding, per day", "Cost of each day a trainer spends on board, without travel."),
      ],
    },
    {
      type: "row",
      fields: [
        amount(
          "trip",
          "Travel, per trip",
          "A return trip to a port that is not the trainer's home base. Also the default flight fare in travel estimates.",
        ),
        amount(
          "night",
          "Hotel, per night",
          "Each night away from home base that is not spent on board. Also the default hotel rate in travel estimates.",
        ),
      ],
    },
    {
      type: "row",
      fields: [
        amount("carRentalPerDay", "Car rental, per day", "Default daily car rental rate in travel estimates."),
        amount("rideshareFare", "Rideshare, per trip", "Default one-way rideshare fare between the airport and the port in travel estimates."),
      ],
    },
  ],
};
