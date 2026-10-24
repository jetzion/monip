import type { MetadataRoute } from "next";

import { getAvailableSections } from "@/lib/queries/content";
import { getPublishedProductRefs } from "@/lib/queries/products";
import { getPublishedStoryRefs } from "@/lib/queries/stories";
import { siteUrl } from "@/lib/site";

/** Published pages only; refreshed by content hooks when content changes. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, stories, available] = await Promise.all([
    getPublishedProductRefs(),
    getPublishedStoryRefs(),
    getAvailableSections(),
  ]);
  const optional = (["services", "success-stories", "about", "clients", "privacy"] as const)
    .filter((key) => available[key])
    .map((key) => ({ url: `${base}/${key}` }));
  return [
    { url: `${base}/` },
    { url: `${base}/products` },
    { url: `${base}/contact` },
    ...optional,
    ...products.map(({ slug, updatedAt }) => ({
      url: `${base}/products/${slug}`,
      lastModified: updatedAt,
    })),
    ...(available["success-stories"]
      ? stories.map(({ slug, updatedAt }) => ({
          url: `${base}/success-stories/${slug}`,
          lastModified: updatedAt,
        }))
      : []),
  ];
}
