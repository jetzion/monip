import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/content/PageHeader";
import { CatalogFilters } from "@/components/products/CatalogFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { catalogHref, parseCatalogParams } from "@/lib/catalog-params";
import { contentAccess } from "@/lib/queries/access";
import { getCategories } from "@/lib/queries/categories";
import { getPage } from "@/lib/queries/content";
import { getPublishedProducts } from "@/lib/queries/products";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const { q, category } = parseCatalogParams(await searchParams);
  const page = await getPage("products", await contentAccess());
  return {
    title: page?.seo?.title || page?.title || "Products",
    description: page?.seo?.description || page?.intro || "Browse MONIP Group product samples.",
    // Filtered and search views share one canonical URL and are not indexed.
    alternates: { canonical: "/products" },
    robots: q || category ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = parseCatalogParams(await searchParams);
  // Title and intro come from Pages ("Products"); the catalog works without that entry.
  const [categories, page] = await Promise.all([getCategories(), getPage("products", await contentAccess())]);
  const category = categories.find((item) => item.slug === params.category);
  const categoryParent = typeof category?.parent === "number" ? category.parent : undefined;
  const unknownCategory = params.category !== "" && !category;

  const products = unknownCategory
    ? []
    : await getPublishedProducts({
        q: params.q,
        category: category && { id: category.id, isSubcategory: categoryParent !== undefined },
      });
  const filtered = params.q !== "" || params.category !== "";

  return (
    <>
      <PageHeader title={page?.title ?? "Products"} intro={page?.intro}>
        <div className="mt-8">
          <CatalogFilters
            params={params}
            categories={categories}
            activeParentId={categoryParent ?? category?.id}
          />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p role="status" className="text-sm text-muted-foreground">
            {resultSummary(products.length, params.q, category?.title)}
          </p>
          {filtered && (
            <Link href="/products" className="text-sm font-semibold text-azure hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-8 shadow-card">
            <p className="font-semibold text-navy">
              {unknownCategory
                ? "That category does not exist."
                : filtered
                  ? "No products match your search."
                  : "No products are published yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {filtered ? (
                <>
                  Try different keywords or{" "}
                  <Link href={catalogHref({})} className="text-azure underline underline-offset-4">
                    browse all products
                  </Link>
                  .
                </>
              ) : (
                "Check back soon."
              )}
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <li key={product.slug} className="flex">
                <ProductCard product={product} eager={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function resultSummary(count: number, q: string, categoryTitle?: string) {
  const noun = count === 1 ? "product" : "products";
  const parts = [`${count} ${noun}`];
  if (categoryTitle) parts.push(`in ${categoryTitle}`);
  if (q) parts.push(`matching "${q}"`);
  return parts.join(" ");
}
