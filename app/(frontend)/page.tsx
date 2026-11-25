import type { Metadata } from "next";
import Link from "next/link";

import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { PageHeader } from "@/components/content/PageHeader";
import { SectionHeading } from "@/components/content/SectionHeading";
import { AuroraBand } from "@/components/home/AuroraBand";
import { ClientLogos } from "@/components/home/ClientLogos";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { HeroVideo } from "@/components/home/HeroVideo";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { StorySpotlight } from "@/components/home/StorySpotlight";
import { ProductCard } from "@/components/products/ProductCard";
import { ButtonLink } from "@/components/ui/button-link";
import { heroBackground } from "@/lib/hero";
import { processCards, serviceId } from "@/lib/process-steps";
import { contentAccess } from "@/lib/queries/access";
import { getAvailableSections, getPublishedClients, getServicesByIds } from "@/lib/queries/content";
import { getHomeContent } from "@/lib/queries/home";
import { getFeaturedProducts } from "@/lib/queries/products";
import { getStoryById } from "@/lib/queries/stories";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Copy is edited in the CMS (Home page global); link targets are fixed here. */
export default async function HomePage() {
  const access = await contentAccess();
  const [{ hero, process: howWeWork, spotlight }, featured, clients, sections] = await Promise.all([
    getHomeContent(access),
    getFeaturedProducts(4),
    getPublishedClients(access),
    getAvailableSections(),
  ]);
  const steps = howWeWork?.steps ?? [];
  const cards = processCards(steps, await getServicesByIds(steps.map((step) => serviceId(step.service)), access));
  const storyRef = spotlight?.story;
  const story = storyRef ? await getStoryById(typeof storyRef === "object" ? storyRef.id : storyRef, access) : null;
  // Without a published story the section is hidden, except as a placeholder in development and Live Preview.
  const showSpotlight = story !== null || process.env.NODE_ENV === "development" || access.draft;
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
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/products" className="h-11 px-5 text-base sm:px-6">
              {hero.productsButtonLabel}
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-inverse" className="h-11 px-5 text-base sm:px-6">
              {hero.contactButtonLabel}
            </ButtonLink>
          </div>
          <Link
            href="/about"
            className="font-semibold text-gold underline decoration-2 underline-offset-4 hover:text-gold-hover"
          >
            {hero.aboutLinkLabel}
          </Link>
        </div>
      </PageHeader>
      {clients.length > 0 && <ClientLogos clients={clients} />}

      {cards.length > 0 && (
        <AuroraBand>
          <ProcessSteps heading={howWeWork?.heading ?? ""} cards={cards} showAllLink={sections.services} />
        </AuroraBand>
      )}
      {showSpotlight && (
        <AuroraBand shade="pale">
          <StorySpotlight heading={spotlight?.heading ?? ""} story={story} />
        </AuroraBand>
      )}
      <AuroraBand shade="sky">
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
      </AuroraBand>
      <ChatInvitation page="home" />
    </>
  );
}
