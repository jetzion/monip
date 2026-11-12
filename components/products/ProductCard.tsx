import { cn } from "cn";
import Link from "next/link";

import { populated } from "@/lib/payload";
import { ImageMorph } from "@/components/media/ImageMorph";
import { compactCardTitle } from "@/components/ui/card-title";
import type { Category, Media, Product } from "@/payload-types";

import { FramedImage } from "./FramedImage";

type Props = {
  product: Pick<Product, "name" | "slug" | "summary" | "primaryImage" | "category">;
  eager?: boolean;
  /** Narrower card for four-across rows on the homepage: no category tag, shorter summary. */
  compact?: boolean;
};

export function ProductCard({ product, eager, compact }: Props) {
  const category = populated<Category>(product.category);
  const image = populated<Media>(product.primaryImage);
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition duration-200 hover:border-gold hover:shadow-card-hover motion-safe:hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <ImageMorph name={`product-image-${product.slug}`}>
        {image?.url ? (
          <FramedImage
            image={{ ...image, url: image.url, width: image.width ?? 1200, height: image.height ?? 900 }}
            sizes={compact ? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            eager={eager}
            className="border-b border-border"
            imageClassName="transition duration-300 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-[4/3] border-b border-border bg-tint" />
        )}
      </ImageMorph>
      <div className={cn("flex flex-1 flex-col gap-2", compact ? "p-4" : "p-5")}>
        {category && !compact && (
          <p className="self-start rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
            {category.title}
          </p>
        )}
        <h3 className={cn("font-semibold leading-snug text-navy", compact ? compactCardTitle : "text-lg")}>
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>
        <p className={cn("text-sm leading-relaxed text-muted-foreground", compact && "line-clamp-3")}>{product.summary}</p>
      </div>
    </article>
  );
}
