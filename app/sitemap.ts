import type { MetadataRoute } from "next";

import { getPublishedProductRefs } from "@/lib/queries/products";
import { siteUrl } from "@/lib/site";

/** Published pages only; refreshed by product hooks when products change. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getPublishedProductRefs();
  return [
    { url: `${base}/` },
    { url: `${base}/products` },
    { url: `${base}/contact` },
    ...products.map(({ slug, updatedAt }) => ({
      url: `${base}/products/${slug}`,
      lastModified: updatedAt,
    })),
  ];
}
