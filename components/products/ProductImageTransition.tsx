import { ViewTransition } from "react";

type Props = { slug: string; children: React.ReactNode };

/** Pairs a product's card image with its detail page image, so the photo morphs between pages. */
export function ProductImageTransition({ slug, children }: Props) {
  return (
    <ViewTransition name={`product-image-${slug}`} share="product-morph" default="none">
      {children}
    </ViewTransition>
  );
}
