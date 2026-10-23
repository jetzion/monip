import type { Metadata } from "next";

import { PageHeader } from "@/components/content/PageHeader";
import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact MONIP Group about a merchandising or sourcing project.",
  alternates: { canonical: "/contact" },
};

/** Approved phone, email, and address will be added once MONIP supplies them. */
export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Discuss a project"
        intro="Tell us what you need, including quantities and timeline, and we will reply by email."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-xl border border-t-4 border-border border-t-primary bg-card p-6 shadow-card sm:p-8">
          <InquiryForm />
        </div>
      </div>
    </>
  );
}
