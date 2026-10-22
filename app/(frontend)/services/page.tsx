import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsImage } from "@/components/media/CmsImage";
import { ButtonLink } from "@/components/ui/button-link";
import { getPublishedServices } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Services MONIP Group provides.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getPublishedServices();
  if (services.length === 0) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Services</h1>

      <nav aria-label="Services on this page" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {services.map((service) => (
            <li key={service.slug}>
              <a
                href={`#${service.slug}`}
                className="inline-flex h-9 items-center border border-border px-3 text-sm font-medium hover:border-foreground/40"
              >
                {service.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 divide-y divide-border border-y border-border">
        {services.map((service) => (
          <section
            key={service.slug}
            id={service.slug}
            aria-labelledby={`${service.slug}-heading`}
            className="grid scroll-mt-8 gap-6 py-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
          >
            <div>
              <h2 id={`${service.slug}-heading`} className="font-display text-2xl font-semibold">
                {service.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{service.summary}</p>
            </div>
            <div className="flex flex-col gap-6">
              {service.image && (
                <div className="overflow-hidden border border-border bg-muted">
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
  );
}
