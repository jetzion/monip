import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
} from "payload";

import type { Product } from "../payload-types";

/** Scripts outside Next.js (e.g. the seed) set this to skip revalidation. */
const skip = (req: PayloadRequest) => Boolean(req.context.disableRevalidate);

const revalidateProductPaths = (...slugs: (string | null | undefined)[]) => {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs)) {
    if (slug) revalidatePath(`/products/${slug}`);
  }
};

export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req,
}) => {
  if (!skip(req)) revalidateProductPaths(doc.slug, previousDoc?.slug);
  return doc;
};

export const revalidateDeletedProduct: CollectionAfterDeleteHook<Product> = ({ doc, req }) => {
  if (!skip(req)) revalidateProductPaths(doc.slug);
  return doc;
};

/** Category names appear on every product page, so refresh them all. */
export const revalidateCategories: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!skip(req)) {
    revalidatePath("/");
    revalidatePath("/products", "layout");
  }
  return doc;
};

export const revalidateDeletedCategory: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!skip(req)) {
    revalidatePath("/");
    revalidatePath("/products", "layout");
  }
  return doc;
};
