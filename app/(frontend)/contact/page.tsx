import type { Metadata } from "next";

import { PageHeader } from "@/components/content/PageHeader";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { getProductBySlug } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact MONIP Group about a merchandising or sourcing project.",
  alternates: { canonical: "/contact" },
};

/**
 * General inquiry form; `?product=<slug>` turns it into a product inquiry
 * for that published product. Unknown slugs fall back to a general inquiry.
 * Approved phone, email, and address will be added once MONIP supplies them.
 */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { product: slug } = await searchParams;
  const product = typeof slug === "string" && slug ? await getProductBySlug(slug) : null;

  return (
    <>
      <PageHeader
        title="Discuss a project"
        intro="Tell us what you need, including quantities and timeline, and we will reply by email."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-xl border border-t-4 border-border border-t-primary bg-card p-6 shadow-card sm:p-8">
          <InquiryForm productSlug={product?.slug} productName={product?.name} />
        </div>
      </div>
    </>
  );
}
