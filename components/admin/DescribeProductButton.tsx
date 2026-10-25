"use client";

import { Button, useAllFormFields, useConfig, useForm } from "@payloadcms/ui";
import { useState } from "react";

import { hasDescribeInput, type DescribeRequest } from "@/lib/describe/product-description";
import type { Product } from "@/payload-types";

const id = (value: unknown) => (typeof value === "number" ? value : null);

/** Picks the fields the AI needs from the current, possibly unsaved, form data. */
function describeRequest(data: Partial<Product>): DescribeRequest {
  const gallery = Array.isArray(data.gallery) ? data.gallery.map(id) : [];
  return {
    name: data.name,
    summary: data.summary,
    categoryId: id(data.category),
    subcategoryId: id(data.subcategory),
    tags: data.tags ?? [],
    materials: data.materials ?? [],
    customizationOptions: data.customizationOptions ?? [],
    applications: data.applications ?? [],
    // An empty array field is held in form state as its row count (0), not [].
    specifications: Array.isArray(data.specifications)
      ? data.specifications.map(({ label, value }) => ({ label, value }))
      : [],
    imageIds: [id(data.primaryImage), ...gallery].filter((value): value is number => value !== null),
  };
}

/**
 * Admin button that asks the AI to draft the Description from the entered
 * images and data. It replaces the Description in the form only; the editor
 * reviews it and saves as usual.
 */
export function DescribeProductButton() {
  useAllFormFields();
  const { getData, dispatchFields, setModified } = useForm();
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const request = describeRequest(getData() as Partial<Product>);
  const enabled = hasDescribeInput(request, request.imageIds.length) || request.categoryId !== null;

  async function generate() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${config.serverURL}${config.routes.api}/products/describe`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as { description?: unknown; error?: string };
      if (!response.ok || !body.description) {
        setMessage(body.error ?? "The description could not be written. Please try again.");
        return;
      }
      dispatchFields({ type: "UPDATE", path: "description", value: body.description, initialValue: body.description });
      setModified(true);
      setMessage("Description written. Review it, then save.");
    } catch {
      setMessage("The description could not be written. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginBottom: "var(--base)" }}>
      <Button buttonStyle="secondary" size="small" margin={false} disabled={!enabled || busy} onClick={generate}>
        {busy ? "Writing description..." : "Write description with AI"}
      </Button>
      <p className="field-description" aria-live="polite">
        {message ??
          (enabled
            ? "Drafts the Description below from the images and details entered so far. Replaces the current Description."
            : "Add an image or product details to enable.")}
      </p>
    </div>
  );
}
