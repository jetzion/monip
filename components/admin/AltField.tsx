"use client";

import { TextField, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { useEffect, useRef } from "react";

import { altFromFilename } from "@/lib/media-alt";

/**
 * Media Alt text field that fills itself from the chosen file's name.
 * It never overwrites text the editor typed: only an empty value or the
 * previous suggestion is replaced when a different file is chosen.
 */
export const AltField: TextFieldClientComponent = (props) => {
  const { value, setValue } = useField<string>({ path: props.path });
  const file = useFormFields(([fields]) => fields.file?.value);
  const suggested = useRef("");

  useEffect(() => {
    if (!(file instanceof File)) return;
    const alt = altFromFilename(file.name);
    if (!value || value === suggested.current) {
      suggested.current = alt;
      setValue(alt);
    }
    // Only a newly chosen file should suggest text, not each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return <TextField {...props} />;
};
