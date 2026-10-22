import { getPayloadClient } from "@/lib/payload";

/**
 * Public product queries. `overrideAccess: false` applies the collection's
 * access rules as an anonymous visitor, so only published products return.
 */
const publicAccess = { overrideAccess: false, draft: false } as const;

const populate = {
  // `url` is computed from `filename` on read, so both must be selected.
  media: { url: true, filename: true, alt: true, width: true, height: true },
  categories: { title: true, slug: true },
} as const;

export async function getPublishedProducts() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
    depth: 1,
    limit: 100,
    sort: "name",
    select: { name: true, slug: true, summary: true, primaryImage: true, category: true },
    populate,
  });
  return docs;
}

export async function getProductBySlug(slug: string) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
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

export async function getPublishedProductSlugs() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    ...publicAccess,
    depth: 0,
    limit: 1000,
    select: { slug: true },
  });
  return docs.map((doc) => doc.slug);
}
