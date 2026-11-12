import { RichText } from "@payloadcms/richtext-lexical/react";
import { cn } from "cn";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { PageHeader } from "@/components/content/PageHeader";
import { CmsImage } from "@/components/media/CmsImage";
import { ButtonLink } from "@/components/ui/button-link";
import { pillClassName, tagItemClassName } from "@/components/ui/pill";
import { TagScroller } from "@/components/ui/tag-scroller";
import { contentAccess } from "@/lib/queries/access";
import { getPage, getPublishedServices } from "@/lib/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("services", await contentAccess());
  return {
    title: page?.seo?.title || page?.title || "Services",
    description: page?.seo?.description || page?.intro || "Services MONIP Group provides.",
    alternates: { canonical: "/services" },
  };
}

/** Title, headline, and intro come from Pages ("Services"); the page works without that entry. */
export default async function ServicesPage() {
  const access = await contentAccess();
  const [services, page] = await Promise.all([getPublishedServices(access), getPage("services", access)]);
  if (services.length === 0) notFound();

  return (
    <>
      <PageHeader
        title={page?.title ?? "Services"}
        headline={page?.headline}
        intro={page?.intro}
        aside={
          <nav aria-label="Services on this page">
            <TagScroller count={services.length} label="services">
              {services.map((service) => (
                <li key={service.slug} className={tagItemClassName}>
                  <a
                    href={`#${service.slug}`}
                    title={service.title}
                    className={cn(pillClassName({ dark: true, compact: true }), "w-full justify-center")}
                  >
                    <span className="truncate">{service.title}</span>
                  </a>
                </li>
              ))}
            </TagScroller>
          </nav>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-6">
          {services.map((service) => (
            <section
              key={service.slug}
              id={service.slug}
              aria-labelledby={`${service.slug}-heading`}
              className="grid scroll-mt-28 gap-6 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12"
            >
              <div className="border-l-4 border-gold pl-5">
                <h2 id={`${service.slug}-heading`} className="font-display text-2xl font-semibold text-navy">
                  {service.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{service.summary}</p>
                {service.image && (
                  <div className="mt-6 overflow-hidden rounded-lg border border-border bg-tint">
                    <CmsImage image={service.image} sizes="(min-width: 1024px) 40vw, 100vw" className="h-auto w-full" />
                  </div>
                )}
              </div>
              {service.body && <RichText data={service.body} className="space-y-4 leading-relaxed" />}
            </section>
          ))}
        </div>

        <div className="mt-12">
          <ButtonLink href="/contact" className="h-11 px-6">
            Discuss a project
          </ButtonLink>
        </div>
      </div>
      <ChatInvitation page="services" />
    </>
  );
}
