import type { Metadata } from "next";

import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact MONIP Group about a merchandising or sourcing project.",
  alternates: { canonical: "/contact" },
};

/** Approved phone, email, and address will be added once MONIP supplies them. */
export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Discuss a project</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Tell us what you need, including quantities and timeline, and we will reply by email.
        </p>
      </div>
      <InquiryForm />
    </div>
  );
}
