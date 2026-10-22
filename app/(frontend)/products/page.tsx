import type { Metadata } from "next";

import { ProductCard } from "@/components/products/ProductCard";
import { getPublishedProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse MONIP Group product samples.",
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Products</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Product samples MONIP can source and customize.
      </p>

      {products.length === 0 ? (
        <p className="mt-12 border border-border bg-muted p-8 text-muted-foreground">
          No products are published yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
