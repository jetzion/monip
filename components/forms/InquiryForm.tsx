"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry, type InquiryState } from "@/lib/inquiries/submit";
import { emailError } from "@/lib/validation/inquiry";
import { formatPhone } from "@/lib/validation/phone";

type Props = {
  productSlug?: string;
  productName?: string;
};

const initialState: InquiryState = { status: "idle" };

/** Seconds the "Inquiry sent" popup stays open before returning home. */
const SENT_SECONDS = 10;

export function InquiryForm({ productSlug, productName }: Props) {
  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const values = state.status === "error" ? state.values : undefined;
  const [phone, setPhone] = useState("");
  // null until the field is checked on blur; "" means the address passed.
  const [emailBlurError, setEmailBlurError] = useState<string | null>(null);
  const emailMessage = emailBlurError ?? errors.email;

  if (state.status === "success") return <SentDialog productName={productName} />;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id="name" label="Name (first & last)" error={errors.name}>
        <Input id="name" name="name" defaultValue={values?.name} autoComplete="name" required {...invalid("name", errors.name)} />
      </Field>
      <Field id="email" label="Email" error={emailMessage} reserveErrorSpace>
        <Input
          id="email"
          name="email"
          defaultValue={values?.email}
          type="email"
          autoComplete="email"
          required
          onBlur={(e) => {
            const value = e.target.value.trim();
            setEmailBlurError(value ? (emailError(value) ?? "") : null);
          }}
          {...invalid("email", emailMessage)}
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
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-5555"
            {...invalid("phone", errors.phone)}
          />
        </Field>
      </div>
      {productSlug && (
        <p className="rounded-md bg-accent px-4 py-3 text-sm">
          <span className="font-semibold">Product:</span> {productName}
        </p>
      )}
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

/** Modal confirming the inquiry was sent; returns home after SENT_SECONDS. */
function SentDialog({ productName }: { productName?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    const timer = setTimeout(() => router.push("/"), SENT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="inquiry-sent-title"
      onClose={() => router.push("/")}
      className="m-auto max-w-md bg-white p-6 shadow-card backdrop:bg-navy/60"
    >
      <h2 id="inquiry-sent-title" className="text-lg font-semibold">
        Inquiry sent
      </h2>
      <p role="status" className="mt-2 text-sm text-muted-foreground">
        We received your inquiry{productName ? ` about ${productName}` : ""} and will reply by
        email. Returning to the home page in {SENT_SECONDS} seconds.
      </p>
      <form method="dialog" className="mt-5">
        <Button type="submit" className="h-11 px-6">
          Go to home page
        </Button>
      </form>
    </dialog>
  );
}

const invalid = (id: string, error?: string) =>
  error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

function Field({
  id,
  label,
  error,
  reserveErrorSpace,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Keeps a blank error line so a message shown on blur does not move the form. */
  reserveErrorSpace?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {(error || reserveErrorSpace) && (
        <p id={`${id}-error`} className="min-h-5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
