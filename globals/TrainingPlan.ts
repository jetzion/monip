import type { GlobalConfig } from "payload";

import { isTraining } from "../access/roles";
import { interpretEndpoint, summarizeEndpoint } from "../lib/training/planner/ai";
import { acceptEndpoint, denied, editEndpoint, recommendEndpoint } from "../lib/training/planner/endpoints";

/**
 * The current training plan from the planner (/admin/training-planner),
 * replaced by each new recommendation. Not in the admin menu. Admins and trainers only.
 */
export const TrainingPlan: GlobalConfig = {
  slug: "training-plan",
  label: "Training plan",
  admin: { hidden: true },
  access: {
    read: isTraining,
    update: isTraining,
  },
  endpoints: [recommendEndpoint, acceptEndpoint, editEndpoint, interpretEndpoint(denied), summarizeEndpoint(denied)],
  fields: [{ name: "current", type: "json" }],
};
