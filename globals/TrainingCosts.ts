import type { GlobalConfig, NumberField } from "payload";

import { isAdmin } from "../access/roles";

const amount = (name: string, label: string, description: string): NumberField => ({
  name,
  label,
  type: "number",
  min: 0,
  admin: { step: 1, description },
});

/**
 * Cost estimates used by the training planner to compare plans. All optional:
 * while empty, plans are compared by format and travel instead. Admin only.
 */
export const TrainingCosts: GlobalConfig = {
  slug: "training-costs",
  label: "Training planning costs",
  admin: {
    description:
      "Estimated costs in US dollars, used by the training planner to compare plans. Leave a value empty while it is unknown. Admins only.",
  },
  access: {
    read: isAdmin,
    update: isAdmin,
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
        amount("trip", "Travel, per trip", "A return trip to a port that is not the trainer's home base."),
        amount("night", "Hotel, per night", "Each night away from home base that is not spent on board."),
      ],
    },
  ],
};
