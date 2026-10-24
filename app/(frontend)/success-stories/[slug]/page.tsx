import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/content/PageHeader";
import { CmsImage } from "@/components/media/CmsImage";
import { pillClassName } from "@/components/ui/pill";
import { ButtonLink } from "@/components/ui/button-link";
import { populated } from "@/lib/payload";
import { contentAccess } from "@/lib/queries/access";
import { getPublishedStoryRefs, getStoryBySlug } from "@/lib/queries/stories";
import { baseOpenGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { formatStoryDate, visibleCustomer } from "@/lib/stories";
import type { Media } from "@/payload-types";

export async function generateStaticParams() {
  const stories = await getPublishedStoryRefs();
  return stories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/success-stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug, await contentAccess());
  if (!story) return {};
  const title = story.seo?.title || story.title;
  const description = story.seo?.description || story.summary;
  const image = populated<Media>(story.featuredImage);
  return {
    title,
    description,
    alternates: { canonical: `/success-stories/${story.slug}` },
    openGraph: {
      ...baseOpenGraph,
      title,
      description,
      url: `/success-stories/${story.slug}`,
      images: image?.url
        ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }]
        : undefined,
    },
  };
}

/** BreadcrumbList structured data; `<` is escaped so CMS text cannot close the script tag. */
function breadcrumbJsonLd(title: string, slug: string) {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Success Stories", item: `${base}/success-stories` },
      { "@type": "ListItem", position: 2, name: title, item: `${base}/success-stories/${slug}` },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function StoryPage({ params }: PageProps<"/success-stories/[slug]">) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug, await contentAccess());
  if (!story) notFound();

  const customer = visibleCustomer(story);
  const date = formatStoryDate(story.publicationDate);
  const details = [
    story.industry && { label: "Industry", value: story.industry },
    customer && { label: "Customer", value: customer },
    date && { label: "Published", value: date },
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(story.title, story.slug) }}
      />
      <PageHeader
        title={story.title}
        intro={story.summary}
        eyebrow={
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-on-dark-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/success-stories" className="text-white underline-offset-4 hover:underline">
                  Success Stories
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{story.title}</li>
            </ol>
          </nav>
        }
      >
        {details.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-2">
            {details.map(({ label, value }) => (
              <div key={label} className={pillClassName({ dark: true, small: true })}>
                <dt className="sr-only">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <CmsImage image={story.featuredImage} sizes="(min-width: 896px) 860px, 100vw" className="h-auto w-full" eager />
        </div>

        {story.body && (
          <div className="mt-10">
            <RichText data={story.body} className="space-y-4 text-lg leading-relaxed" />
          </div>
        )}

        {story.gallery && story.gallery.length > 0 && (
          <ul aria-label="Project photos" className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {story.gallery.map((image, index) => (
              <li key={index} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                <CmsImage image={image} sizes="(min-width: 640px) 280px, 50vw" className="h-auto w-full" />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-8">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/success-stories" variant="outline">
            All success stories
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
