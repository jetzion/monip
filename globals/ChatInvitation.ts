import type { ArrayField, GlobalConfig } from "payload";

import { isLoggedIn } from "../access/content";
import { isAdminField } from "../access/roles";
import { revalidateSiteGlobal } from "../hooks/revalidate";
import { fixedPages, pickFixedPageQuestions } from "../lib/invitation/hooks";

/** Page types that show the invitation, with their admin labels. */
export const invitationPages = {
  home: "Home",
  products: "Products list",
  product: "Product detail",
  services: "Services",
  stories: "Success Stories list",
  story: "Success Story detail",
  about: "About",
  clients: "Clients",
} as const;

type InvitationPage = keyof typeof invitationPages;

const questionList = (name: InvitationPage): ArrayField => ({
  name,
  type: "array",
  label: invitationPages[name],
  labels: { singular: "Question", plural: "Questions" },
  admin: { initCollapsed: false },
  fields: [{ name: "question", type: "text", required: true, maxLength: 80 }],
});

/** Timed invitation bubble beside the "Chat with us" button. */
export const ChatInvitation: GlobalConfig = {
  slug: "chat-invitation",
  label: "Chat invitation",
  admin: {
    description:
      "A short question shown beside the \"Chat with us\" button for 10 seconds. Never shown on Contact, Privacy, or the 404 page.",
  },
  access: {
    read: () => true,
    update: isLoggedIn,
  },
  hooks: {
    beforeChange: [pickFixedPageQuestions],
    afterChange: [revalidateSiteGlobal],
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      label: "Show the chat invitation",
      defaultValue: false,
      access: { update: isAdminField },
      admin: { description: "Only admins can switch this on or off." },
    },
    {
      name: "timesPerVisit",
      type: "number",
      label: "Times shown per visit",
      defaultValue: 1,
      access: { update: isAdminField },
      validate: (value: number | null | undefined) =>
        value == null || (Number.isInteger(value) && value >= 1 && value <= 10) || "Enter a whole number from 1 to 10.",
      admin: {
        step: 1,
        description:
          "How many pages in one browser tab show the invitation (1 to 10), at most once per page. It stops once the visitor opens the chat. Only admins can change this.",
      },
    },
    {
      name: "questions",
      type: "group",
      label: "Questions by page",
      admin: {
        description:
          "Add a few short questions for each page. AI picks the one that fits each page best. Pages with no questions show no invitation.",
      },
      fields: Object.keys(invitationPages).map((page) => questionList(page as InvitationPage)),
    },
    {
      name: "picks",
      type: "group",
      label: "Questions chosen by AI",
      admin: {
        description:
          "Picked when this page is saved. Product and Success Story pages show their own pick, chosen when each is published.",
      },
      fields: fixedPages.map((page) => ({
        name: page,
        type: "text" as const,
        label: invitationPages[page],
        admin: { readOnly: true },
      })),
    },
  ],
};
