import type { GlobalConfig } from "payload";

import { isTraining } from "../access/roles";

/**
 * Ships and start ports preferred for training, chosen on
 * /admin/training-preferences from the Cruise Fleet Schedule.
 * Not in the admin menu. Admins and trainers only.
 */
export const TrainingPreferences: GlobalConfig = {
  slug: "training-preferences",
  label: "Training preferences",
  admin: { hidden: true },
  access: {
    read: isTraining,
    update: isTraining,
  },
  fields: [
    { name: "ships", label: "Preferred ships", type: "text", hasMany: true },
    { name: "ports", label: "Preferred ports", type: "text", hasMany: true },
  ],
};
