import type { Metadata } from "next";
import Link from "next/link";

import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { PageHeader } from "@/components/content/PageHeader";
import { SectionHeading } from "@/components/content/SectionHeading";
import { HeroVideo } from "@/components/home/HeroVideo";
import { ProductCard } from "@/components/products/ProductCard";
import { ButtonLink } from "@/components/ui/button-link";
import { contentAccess } from "@/lib/queries/access";
import { getHomeContent } from "@/lib/queries/home";
import { getFeaturedProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Copy is edited in the CMS (Home page global); link targets are fixed here. */
export default async function HomePage() {
  const [{ hero, closing }, featured] = await Promise.all([
    getHomeContent(await contentAccess()),
    getFeaturedProducts(),
  ]);

  return (
    <>
      <PageHeader
        size="hero"
        background={<HeroVideo />}
        title={hero.headline}
        intro={hero.intro}
      >
        <Link
          href="/about"
          className="mt-4 inline-block font-semibold text-white underline underline-offset-4 hover:text-on-dark-muted"
        >
          {hero.aboutLinkLabel}
        </Link>
      </PageHeader>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading id="featured-heading">Featured products</SectionHeading>
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

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-col gap-6 rounded-2xl bg-[linear-gradient(115deg,var(--primary)_0%,var(--azure)_100%)] px-6 py-12 text-white shadow-card sm:px-12 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display max-w-xl text-3xl font-semibold leading-tight">
            {closing.heading}
          </h2>
          <ButtonLink href="/contact" variant="inverse" className="h-11 self-start px-6 md:self-auto">
            {closing.buttonLabel}
          </ButtonLink>
        </div>
      </section>
      <ChatInvitation page="home" />
    </>
  );
}
