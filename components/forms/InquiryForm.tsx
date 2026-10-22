"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry, type InquiryState } from "@/lib/inquiries/submit";

type Props = {
  productSlug?: string;
  productName?: string;
};

const initialState: InquiryState = { status: "idle" };

export function InquiryForm({ productSlug, productName }: Props) {
  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const values = state.status === "error" ? state.values : undefined;

  if (state.status === "success") {
    return (
      <div role="status" className="border border-border bg-accent p-6">
        <p className="font-semibold">Inquiry sent</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We received your inquiry{productName ? ` about ${productName}` : ""} and will reply by
          email.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id="name" label="Name" error={errors.name}>
        <Input id="name" name="name" defaultValue={values?.name} autoComplete="name" required {...invalid("name", errors.name)} />
      </Field>
      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          name="email"
          defaultValue={values?.email}
          type="email"
          autoComplete="email"
          required
          {...invalid("email", errors.email)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="company" label="Company (optional)" error={errors.company}>
          <Input
            id="company"
            name="company"
            defaultValue={values?.company}
            autoComplete="organization"
            {...invalid("company", errors.company)}
          />
        </Field>
        <Field id="phone" label="Phone (optional)" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            defaultValue={values?.phone}
            type="tel"
            autoComplete="tel"
            {...invalid("phone", errors.phone)}
          />
        </Field>
      </div>
      <Field id="message" label="Message" error={errors.message}>
        <Textarea
          id="message"
          name="message"
          defaultValue={values?.message}
          rows={5}
          required
          placeholder="Quantities, timeline, and any customization you need."
          {...invalid("message", errors.message)}
        />
      </Field>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 self-start px-6">
        {pending ? "Sending..." : "Send inquiry"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Privacy notice placeholder: MONIP will supply approved text on how inquiry details are used.
      </p>
    </form>
  );
}

const invalid = (id: string, error?: string) =>
  error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
