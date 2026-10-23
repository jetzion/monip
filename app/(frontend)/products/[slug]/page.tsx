import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/content/PageHeader";
import { SectionHeading } from "@/components/content/SectionHeading";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { CmsImage } from "@/components/media/CmsImage";
import { SpecSheet } from "@/components/products/SpecSheet";
import { pillClassName } from "@/components/ui/pill";
import { populated } from "@/lib/payload";
import { contentAccess } from "@/lib/queries/access";
import { getProductBySlug, getPublishedProductRefs } from "@/lib/queries/products";
import { baseOpenGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Category, Media } from "@/payload-types";

const LABELS: Record<string, string> = { new: "New", sustainable: "Sustainable" };

export async function generateStaticParams() {
  const products = await getPublishedProductRefs();
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, await contentAccess());
  if (!product) return {};
  const title = product.seo?.title || product.name;
  const description = product.seo?.description || product.summary;
  const image = populated<Media>(product.primaryImage);
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      ...baseOpenGraph,
      title,
      description,
      url: `/products/${product.slug}`,
      images: image?.url
        ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }]
        : undefined,
    },
  };
}

/** BreadcrumbList structured data; `<` is escaped so CMS text cannot close the script tag. */
function breadcrumbJsonLd(name: string, slug: string) {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Products", item: `${base}/products` },
      { "@type": "ListItem", position: 2, name, item: `${base}/products/${slug}` },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, await contentAccess());
  if (!product) notFound();

  const category = populated<Category>(product.category);
  const subcategory = populated<Category>(product.subcategory);
  const join = (items?: string[] | null) => (items ?? []).join(", ");

  const specs = [
    { label: "Category", value: [category?.title, subcategory?.title].filter(Boolean).join(" / ") },
    { label: "Materials", value: join(product.materials) },
    { label: "Customization", value: join(product.customizationOptions) },
    { label: "Industries / applications", value: join(product.applications) },
    ...(product.specifications ?? []).map((row) => ({ label: row.label, value: row.value })),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(product.name, product.slug) }}
      />
      <PageHeader
        title={product.name}
        intro={product.summary}
        eyebrow={
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-on-dark-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/products" className="text-white underline-offset-4 hover:underline">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{product.name}</li>
            </ol>
          </nav>
        }
      >
        {product.labels && product.labels.length > 0 && (
          <ul className="mt-6 flex gap-2">
            {product.labels.map((label) => (
              <li key={label} className={pillClassName({ dark: true, small: true })}>
                {LABELS[label] ?? label}
              </li>
            ))}
          </ul>
        )}
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <CmsImage
              image={product.primaryImage}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="h-auto w-full"
              eager
            />
          </div>
          {product.gallery && product.gallery.length > 0 && (
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {product.gallery.map((image, index) => (
                <li key={index} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                  <CmsImage image={image} sizes="(min-width: 640px) 15vw, 33vw" className="h-auto w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {product.description && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <RichText data={product.description} className="space-y-4 leading-relaxed" />
            </div>
          )}
          <SpecSheet rows={specs} />
        </div>
      </div>

      <section aria-labelledby="inquiry-heading" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHeading id="inquiry-heading">Ask about this product</SectionHeading>
            <p className="mt-4 text-muted-foreground">Your inquiry will reference {product.name}.</p>
          </div>
          <div className="rounded-xl border border-t-4 border-border border-t-primary bg-card p-6 shadow-card sm:p-8">
            <InquiryForm productSlug={product.slug} productName={product.name} />
          </div>
        </div>
      </section>
    </>
  );
}
