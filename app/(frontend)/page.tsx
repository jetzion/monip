import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/products/ProductCard";
import { ButtonLink } from "@/components/ui/button-link";
import { getFeaturedProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Hero and closing copy are drafts pending MONIP-approved messaging. */
export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-tint">
        <div
          aria-hidden="true"
          className="brand-glow pointer-events-none absolute inset-0"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
          <h1 className="font-display max-w-4xl text-4xl font-semibold leading-[1.05] text-navy sm:text-6xl lg:text-7xl">
            Merchandising and product sourcing for business
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-primary">
            Draft positioning copy. MONIP will supply the approved message.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/products" className="h-11 px-6">
              Browse products
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="h-11 px-6">
              Discuss a project
            </ButtonLink>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="featured-heading" className="font-display text-3xl font-semibold text-navy sm:text-4xl">
                Featured products
              </h2>
              <Link href="/products" className="text-sm font-semibold text-azure hover:underline">
                View all products
              </Link>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, index) => (
                <li key={product.slug} className="flex">
                  {/* On phones the first card is above the fold (LCP). */}
                  <ProductCard product={product} eager={index === 0} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-navy bg-[linear-gradient(115deg,var(--navy)_0%,#25306b_60%,var(--azure)_130%)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display max-w-xl text-3xl font-semibold leading-tight">
            Have a product or program in mind?
          </h2>
          <ButtonLink href="/contact" variant="inverse" className="h-11 self-start px-6 md:self-auto">
            Discuss a project
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
