import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/roles";
import { acceptEndpoint, editEndpoint, recommendEndpoint } from "../lib/training/planner/endpoints";

/**
 * The current training plan from the planner (/admin/training-planner),
 * replaced by each new recommendation. Not in the admin menu. Admin only.
 */
export const TrainingPlan: GlobalConfig = {
  slug: "training-plan",
  label: "Training plan",
  admin: { hidden: true },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  endpoints: [recommendEndpoint, acceptEndpoint, editEndpoint],
  fields: [{ name: "current", type: "json" }],
};
