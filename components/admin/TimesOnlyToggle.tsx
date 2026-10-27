"use client";

import { CheckboxInput, usePreferences } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TIMES_ONLY_KEY, type TimesOnlyValue } from "@/lib/sailings/times-only";

/**
 * Hides sailings missing an arrival or departure time. The choice is saved
 * as an admin preference, which the collection's baseFilter reads on the server.
 */
export function TimesOnlyToggle({ initial }: { initial: boolean }) {
  const { setPreference } = usePreferences();
  const router = useRouter();
  const [checked, setChecked] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = async (value: boolean) => {
    setChecked(value);
    await setPreference<TimesOnlyValue>(TIMES_ONLY_KEY, value ? "hide" : "show");
    startTransition(() => router.refresh());
  };

  return (
    <CheckboxInput
      id="sailing-times-only"
      className="sailing-filters__toggle"
      label="Hide sailings without arrival and departure times"
      checked={checked}
      readOnly={pending}
      onToggle={(event) => void toggle(event.target.checked)}
    />
  );
}
