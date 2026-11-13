import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";
import { keepBookedTrainer } from "../lib/training/hooks";

/** Keeps the full name used as the title and in the trainer dropdown. */
const setName: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const first = data.firstName ?? originalDoc?.firstName;
  const last = data.lastName ?? originalDoc?.lastName;
  return { ...data, name: `${first} ${last}`.trim() };
};

/** People who deliver product training on cruises. Admin only. */
export const Trainers: CollectionConfig = {
  slug: "trainers",
  labels: { singular: "Trainer", plural: "Trainers" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["firstName", "lastName", "updatedAt"],
    description: "Trainers available in the Training Schedule. Admins only.",
  },
  defaultSort: ["lastName", "firstName"],
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [setName],
    beforeDelete: [keepBookedTrainer],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "firstName", label: "First name", type: "text", required: true },
        { name: "lastName", label: "Last name", type: "text", required: true },
      ],
    },
    { name: "name", type: "text", admin: { hidden: true } },
    {
      type: "row",
      fields: [
        {
          name: "homeBase",
          label: "Home base",
          type: "relationship",
          relationTo: "port-time-zones",
          admin: {
            description: "The trainer's nearest start port. The training planner counts sessions elsewhere as travel.",
          },
        },
        {
          name: "maxDaysPerMonth",
          label: "Maximum training days per month",
          type: "number",
          min: 1,
          max: 31,
          admin: { step: 1, description: "Used by the training planner. Leave empty for no limit." },
        },
      ],
    },
    {
      name: "canJoinCruises",
      label: "Can join cruises",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Only trainers who can join cruises are suggested for onboarding training." },
    },
  ],
};
