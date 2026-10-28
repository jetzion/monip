import type { TextField } from "payload";

/** Chat invitation question picked by AI on publish (see Chat invitation settings). */
export const invitationQuestionField: TextField = {
  name: "invitationQuestion",
  label: "Chat invitation question",
  type: "text",
  admin: {
    position: "sidebar",
    readOnly: true,
    description: "Chosen by AI from the Chat invitation questions when this page is published.",
  },
};
