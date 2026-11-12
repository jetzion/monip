import type { Metadata } from "next";
import Link from "next/link";

import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { PageHeader } from "@/components/content/PageHeader";
import { SectionHeading } from "@/components/content/SectionHeading";
import { CatalogFilters } from "@/components/products/CatalogFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { catalogHref, parseCatalogParams } from "@/lib/catalog-params";
import { contentAccess } from "@/lib/queries/access";
import { getCategories } from "@/lib/queries/categories";
import { getPage } from "@/lib/queries/content";
import { populated } from "@/lib/payload";
import { getPublishedProducts } from "@/lib/queries/products";
import type { Category } from "@/payload-types";

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
  // Title, headline, and intro come from Pages ("Products"); the catalog works without that entry.
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
      <PageHeader title={page?.title ?? "Products"} headline={page?.headline} intro={page?.intro}>
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
            <Link href="/products" className="link-accent text-sm">
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
                  <Link href={catalogHref({})} className="link-accent">
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
          <div className="mt-8 flex flex-col gap-14">
            {groupByCategory(products).map((group) => (
              <section key={group.id} aria-labelledby={`category-${group.id}`}>
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-border pb-4">
                  <SectionHeading id={`category-${group.id}`} className="text-2xl sm:text-3xl">
                    {group.title}
                  </SectionHeading>
                  <p className="text-sm text-muted-foreground">
                    {group.products.length} {group.products.length === 1 ? "product" : "products"}
                  </p>
                </div>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.products.map((product, index) => (
                    <li key={product.slug} className="flex">
                      <ProductCard product={product} eager={group.start + index < 3} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <ChatInvitation page="products" />
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

type CatalogProduct = Awaited<ReturnType<typeof getPublishedProducts>>[number];

/** Splits products (already sorted by category) into one group per category. */
function groupByCategory(products: CatalogProduct[]) {
  const groups: { id: number; title: string; start: number; products: CatalogProduct[] }[] = [];
  products.forEach((product, index) => {
    const category = populated<Category>(product.category);
    const id = category?.id ?? 0;
    if (groups.at(-1)?.id !== id) groups.push({ id, title: category?.title ?? "Other", start: index, products: [] });
    groups.at(-1)!.products.push(product);
  });
  return groups;
}
