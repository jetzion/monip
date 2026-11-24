import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { editTabsHiddenFromTrainers, hiddenFromTrainers, isAdmin, isAdminField, isAdminOrSelf } from "../access/roles";

/** Keeps the full name from First and Last name whenever either is saved. */
const setName: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!("firstName" in data) && !("lastName" in data)) return data;
  const first = data.firstName ?? originalDoc?.firstName ?? "";
  const last = data.lastName ?? originalDoc?.lastName ?? "";
  return { ...data, name: `${first} ${last}`.trim() || null };
};

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
    defaultColumns: ["email", "firstName", "lastName", "role"],
  },
  auth: true,
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [ensureFirstUserIsAdmin, setName],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "firstName", label: "First name", type: "text" },
        { name: "lastName", label: "Last name", type: "text" },
      ],
    },
    // The full name, kept from First and Last name on save (avatar initials, display).
    { name: "name", type: "text", admin: { hidden: true } },
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
