"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { errorMessages } from "@/lib/training/form";

/** Cancels a session (after confirmation) or restores a canceled one. */
export function TrainingSessionCancel({ id, canceled }: { id: number; canceled: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (!canceled && !window.confirm("Cancel this training session? It stays in the calendar, marked Canceled.")) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/training-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canceled: !canceled }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) return setError(errorMessages(await response?.json().catch(() => null)).join(" "));
    router.refresh();
  };

  return (
    <>
      <Button buttonStyle="secondary" size="medium" disabled={saving} onClick={() => void toggle()}>
        {canceled ? "Restore session" : "Cancel session"}
      </Button>
      {error && (
        <p role="alert" className="training-form__error">
          {error}
        </p>
      )}
    </>
  );
}
