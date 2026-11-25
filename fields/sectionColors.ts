import type { Field, TextFieldSingleValidation } from "payload";

const HEX = /^#[0-9a-f]{6}$/i;

const validateHex: TextFieldSingleValidation = (value) =>
  !value || HEX.test(value) || "Use a colour like #1a4f8b, or leave empty.";

const color = (name: string, label: string, description: string): Field => ({
  name,
  label,
  type: "text",
  validate: validateHex,
  admin: {
    width: "33%",
    description,
    components: { afterInput: ["/components/admin/ColorPicker#ColorPicker"] },
  },
});

/** Three optional background colours for a homepage band; empty ones keep the built-in shade. */
export const sectionColors: Field = {
  name: "colors",
  type: "group",
  label: "Background colours",
  admin: {
    description:
      "The section's background: a base colour with two layers of soft drifting clouds. Leave a colour empty to keep the built-in shade. Keep them light so the text stays readable; check in Live Preview.",
  },
  fields: [
    {
      type: "row",
      fields: [
        color("base", "Base", "Fills the whole section."),
        color("clouds", "Clouds", "The main cloud layer."),
        color("highlights", "Highlights", "The second, softer cloud layer."),
      ],
    },
  ],
};
