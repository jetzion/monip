import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { editTabsHiddenFromTrainers, hiddenFromTrainers, isAdmin, isAdminField, isAdminOrSelf } from "../access/roles";

/** Makes the first account an admin so someone can manage users. */
const ensureFirstUserIsAdmin: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") return data;
  const { totalDocs } = await req.payload.count({ collection: "users", req });
  return totalDocs === 0 ? { ...data, role: "admin" } : data;
};

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    // Trainers reach their own account from the avatar menu, not the navigation.
    hidden: hiddenFromTrainers,
    components: { views: { edit: editTabsHiddenFromTrainers } },
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role"],
  },
  auth: true,
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [ensureFirstUserIsAdmin],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      saveToJWT: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Trainer", value: "trainer" },
      ],
      admin: {
        description: "Admins manage users. Editors manage site content. Trainers use the Training Schedule and its tools.",
      },
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
};
