"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { errorMessages } from "@/lib/training/form";

/** Deletes a session after confirmation, then closes its details. */
export function TrainingSessionDelete({ id, closeHref }: { id: number; closeHref: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (!window.confirm("Delete this training session? This cannot be undone.")) return;
    setDeleting(true);
    const response = await fetch(`/api/training-sessions/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setError(errorMessages(await response?.json().catch(() => null)).join(" "));
      setDeleting(false);
      return;
    }
    router.push(closeHref);
    router.refresh();
  };

  return (
    <>
      <Button buttonStyle="secondary" size="medium" disabled={deleting} onClick={() => void remove()}>
        Delete
      </Button>
      {error && (
        <p role="alert" className="training-form__error">
          {error}
        </p>
      )}
    </>
  );
}
