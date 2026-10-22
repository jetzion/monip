import Link from "next/link";

import { CmsImage } from "@/components/media/CmsImage";
import { populated } from "@/lib/payload";
import type { Category, Product } from "@/payload-types";

type Props = {
  product: Pick<Product, "name" | "slug" | "summary" | "primaryImage" | "category">;
};

export function ProductCard({ product }: Props) {
  const category = populated<Category>(product.category);
  return (
    <article className="relative flex w-full flex-col border border-border bg-card transition-colors hover:border-foreground/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <CmsImage
          image={product.primaryImage}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t border-border p-5">
        {category && <p className="text-sm text-muted-foreground">{category.title}</p>}
        <h2 className="text-lg font-semibold leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.summary}</p>
      </div>
    </article>
  );
}
