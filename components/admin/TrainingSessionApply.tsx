"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { errorMessages } from "@/lib/training/form";

/**
 * Saves the session unchanged, so the server recalculates its times from the
 * cruise as it is now, updates its copy of the cruise, and rechecks conflicts.
 */
export function TrainingSessionApply({ id }: { id: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/training-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) {
      setError(errorMessages(await response?.json().catch(() => null)).join(" "));
      return;
    }
    router.refresh();
  };

  return (
    <>
      <Button buttonStyle="primary" size="medium" disabled={saving} onClick={() => void apply()}>
        Update to current cruise details
      </Button>
      {error && (
        <p role="alert" className="training-form__error">
          {error}
        </p>
      )}
    </>
  );
}
