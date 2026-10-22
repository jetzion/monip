import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/products/CatalogFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { catalogHref, parseCatalogParams } from "@/lib/catalog-params";
import { getCategories } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const { q, category } = parseCatalogParams(await searchParams);
  return {
    title: "Products",
    description: "Browse MONIP Group product samples.",
    // Filtered and search views share one canonical URL and are not indexed.
    alternates: { canonical: "/products" },
    robots: q || category ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = parseCatalogParams(await searchParams);
  const categories = await getCategories();
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Products</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Product samples MONIP can source and customize.
      </p>

      <div className="mt-10">
        <CatalogFilters
          params={params}
          categories={categories}
          activeParentId={categoryParent ?? category?.id}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4 border-t border-border pt-6">
        <p role="status" className="text-sm text-muted-foreground">
          {resultSummary(products.length, params.q, category?.title)}
        </p>
        {filtered && (
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="mt-8 border border-border bg-muted p-8">
          <p className="font-medium">
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
                <Link href={catalogHref({})} className="text-primary underline underline-offset-4">
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
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.slug} className="flex">
              <ProductCard product={product} eager={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function resultSummary(count: number, q: string, categoryTitle?: string) {
  const noun = count === 1 ? "product" : "products";
  const parts = [`${count} ${noun}`];
  if (categoryTitle) parts.push(`in ${categoryTitle}`);
  if (q) parts.push(`matching "${q}"`);
  return parts.join(" ");
}
