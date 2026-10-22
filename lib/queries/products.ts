import type { Where } from "payload";

import { getPayloadClient } from "@/lib/payload";
import type { contentAccess } from "@/lib/queries/access";

/**
 * Public product queries. `overrideAccess: false` applies the collection's
 * access rules as an anonymous visitor, so only published products return.
 */
export const publicAccess = { overrideAccess: false, draft: false } as const;

/** Local API access options; pages pass `contentAccess()` to allow previews. */
export type ContentAccess = typeof publicAccess | Awaited<ReturnType<typeof contentAccess>>;

const populate = {
  // `url` is computed from `filename` on read, so both must be selected.
  media: { url: true, filename: true, alt: true, width: true, height: true },
  categories: { title: true, slug: true },
} as const;

export type ProductFilters = {
  /** Keywords matched (case-insensitive, all words) in name, summary, tags, or materials. */
  q?: string;
  category?: { id: number; isSubcategory: boolean };
};

const filterWhere = ({ q, category }: ProductFilters): Where => {
  const and: Where[] = [];
  if (q) {
    and.push({
      or: [
        { name: { like: q } },
        { summary: { like: q } },
        { tags: { like: q } },
        { materials: { like: q } },
      ],
    });
  }
  if (category) {
    and.push({ [category.isSubcategory ? "subcategory" : "category"]: { equals: category.id } });
  }
  return { and };
};

export async function getPublishedProducts(filters: ProductFilters = {}) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
    depth: 1,
    limit: 100,
    sort: "name",
    where: filterWhere(filters),
    select: { name: true, slug: true, summary: true, primaryImage: true, category: true },
    populate,
  });
  return docs;
}

export async function getFeaturedProducts(limit = 3) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
    depth: 1,
    limit,
    where: { featured: { equals: true } },
    sort: "-publishedAt",
    select: { name: true, slug: true, summary: true, primaryImage: true, category: true },
    populate,
  });
  return docs;
}

export async function getProductBySlug(slug: string, access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...access,
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug } },
    select: {
      name: true,
      slug: true,
      summary: true,
      description: true,
      primaryImage: true,
      gallery: true,
      category: true,
      subcategory: true,
      materials: true,
      customizationOptions: true,
      applications: true,
      labels: true,
      specifications: true,
      seo: true,
    },
    populate,
  });
  return docs[0] ?? null;
}

/** Slugs and last-modified dates of all published products. */
export async function getPublishedProductRefs() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
    depth: 0,
    limit: 1000,
    select: { slug: true, updatedAt: true },
  });
  return docs.map(({ slug, updatedAt }) => ({ slug, updatedAt }));
}
