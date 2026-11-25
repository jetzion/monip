"use client";

import { useField } from "@payloadcms/ui";

/** Colour picker inside a hex colour text field (admin.components.afterInput); the text stays editable. */
export function ColorPicker() {
  const { value, setValue, readOnly } = useField<string>();

  return (
    <input
      type="color"
      className="color-picker"
      aria-label="Pick a colour"
      disabled={readOnly}
      value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#ffffff"}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
