import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CmsImage } from "@/components/media/CmsImage";
import { SpecSheet } from "@/components/products/SpecSheet";
import { populated } from "@/lib/payload";
import { getProductBySlug, getPublishedProductSlugs } from "@/lib/queries/products";
import type { Category } from "@/payload-types";

const LABELS: Record<string, string> = { new: "New", sustainable: "Sustainable" };

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seo?.title || product.name,
    description: product.seo?.description || product.summary,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/products" className="hover:text-foreground hover:underline">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden border border-border bg-muted">
            <CmsImage
              image={product.primaryImage}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="h-auto w-full"
              priority
            />
          </div>
          {product.gallery && product.gallery.length > 0 && (
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {product.gallery.map((image, index) => (
                <li key={index} className="overflow-hidden border border-border bg-muted">
                  <CmsImage image={image} sizes="(min-width: 640px) 15vw, 33vw" className="h-auto w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.labels && product.labels.length > 0 && (
            <ul className="mt-4 flex gap-2">
              {product.labels.map((label) => (
                <li key={label} className="border border-border px-2 py-0.5 text-sm">
                  {LABELS[label] ?? label}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{product.summary}</p>

          {product.description && (
            <RichText data={product.description} className="mt-6 space-y-4 leading-relaxed" />
          )}

          <h2 className="mt-10 text-sm font-semibold">Specifications</h2>
          <div className="mt-3">
            <SpecSheet rows={specs} />
          </div>
        </div>
      </div>
    </div>
  );
}
