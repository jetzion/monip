import type { Metadata } from "next";
import Link from "next/link";

import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { PageHeader } from "@/components/content/PageHeader";
import { SectionHeading } from "@/components/content/SectionHeading";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { HeroVideo } from "@/components/home/HeroVideo";
import { ProductCard } from "@/components/products/ProductCard";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ButtonLink } from "@/components/ui/button-link";
import { chosenIds } from "@/lib/featured-services";
import { heroBackground } from "@/lib/hero";
import { contentAccess } from "@/lib/queries/access";
import { getFeaturedServices } from "@/lib/queries/content";
import { getHomeContent } from "@/lib/queries/home";
import { getFeaturedProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Copy is edited in the CMS (Home page global); link targets are fixed here. */
export default async function HomePage() {
  const access = await contentAccess();
  const [{ hero, featuredServices }, featured] = await Promise.all([
    getHomeContent(access),
    getFeaturedProducts(4),
  ]);
  const services = await getFeaturedServices(chosenIds(featuredServices), access);
  const background = heroBackground(hero);

  return (
    <>
      <PageHeader
        size="hero"
        background={
          background.kind === "video" ? (
            <HeroVideo src={background.src} poster={background.poster} />
          ) : (
            <HeroSlideshow
              slides={background.slides}
              transition={background.transition}
              transitionSeconds={background.transitionSeconds}
              overlayOpacity={background.overlayOpacity}
            />
          )
        }
        title={hero.headline}
        intro={hero.intro}
      >
        <Link
          href="/about"
          className="mt-4 inline-block font-semibold text-gold underline decoration-2 underline-offset-4 hover:text-gold-hover"
        >
          {hero.aboutLinkLabel}
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {services.length > 0 && (
          <section aria-labelledby="services-heading" className="mb-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading id="services-heading">Our services</SectionHeading>
              <Link href="/services" className="link-accent text-sm">
                View all services
              </Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <li key={service.slug} className="flex">
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="mb-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading id="featured-heading">Featured products</SectionHeading>
              <Link href="/products" className="link-accent text-sm">
                View all products
              </Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product, index) => (
                <li key={product.slug} className="flex">
                  {/* On phones the first card is above the fold (LCP). */}
                  <ProductCard product={product} eager={index === 0} compact />
                </li>
              ))}
            </ul>
          </section>
        )}
        <ButtonLink href="/contact" className="h-10 px-5">
          Discuss a project
        </ButtonLink>
      </div>
      <ChatInvitation page="home" />
    </>
  );
}
