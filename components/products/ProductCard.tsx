import Link from "next/link";

import { CmsImage } from "@/components/media/CmsImage";
import { populated } from "@/lib/payload";
import type { Category, Product } from "@/payload-types";

type Props = {
  product: Pick<Product, "name" | "slug" | "summary" | "primaryImage" | "category">;
  eager?: boolean;
};

export function ProductCard({ product, eager }: Props) {
  const category = populated<Category>(product.category);
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <div className="aspect-[4/3] overflow-hidden bg-tint">
        <CmsImage
          image={product.primaryImage}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          eager={eager}
          className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {category && <p className="text-sm font-medium text-azure">{category.title}</p>}
        <h2 className="text-lg font-semibold leading-snug text-navy">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
          >
            {product.name}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.summary}</p>
      </div>
    </article>
  );
}
