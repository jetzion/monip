import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/content/PageHeader";
import { CmsImage } from "@/components/media/CmsImage";
import { ButtonLink } from "@/components/ui/button-link";
import { pillClassName } from "@/components/ui/pill";
import { contentAccess } from "@/lib/queries/access";
import { getPublishedServices } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Services MONIP Group provides.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getPublishedServices(await contentAccess());
  if (services.length === 0) notFound();

  return (
    <>
      <PageHeader title="Services">
        <nav aria-label="Services on this page" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {services.map((service) => (
              <li key={service.slug}>
                <a
                  href={`#${service.slug}`}
                  className={pillClassName({ dark: true })}
                >
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-6">
          {services.map((service) => (
            <section
              key={service.slug}
              id={service.slug}
              aria-labelledby={`${service.slug}-heading`}
              className="grid scroll-mt-28 gap-6 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12"
            >
              <div className="border-l-4 border-primary pl-5">
                <h2 id={`${service.slug}-heading`} className="font-display text-2xl font-semibold text-navy">
                  {service.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{service.summary}</p>
              </div>
              <div className="flex flex-col gap-6">
                {service.image && (
                  <div className="overflow-hidden rounded-lg border border-border bg-tint">
                    <CmsImage image={service.image} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
                  </div>
                )}
                {service.body && <RichText data={service.body} className="space-y-4 leading-relaxed" />}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12">
          <ButtonLink href="/contact" className="h-11 px-6">
            Discuss a project
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
