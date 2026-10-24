import { getPayloadClient } from "@/lib/payload";
import { publicAccess, type ContentAccess } from "@/lib/queries/products";

const populate = { media: { url: true, filename: true, alt: true, width: true, height: true } } as const;

const cardFields = {
  title: true,
  slug: true,
  summary: true,
  featuredImage: true,
  industry: true,
  customerName: true,
  customerApproved: true,
  publicationDate: true,
} as const;

export async function getPublishedStories(access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "success-stories",
    ...access,
    depth: 1,
    limit: 100,
    sort: "_order",
    select: cardFields,
    populate,
  });
  return docs;
}

export async function getStoryBySlug(slug: string, access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "success-stories",
    ...access,
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug } },
    select: { ...cardFields, body: true, gallery: true, seo: true },
    populate,
  });
  return docs[0] ?? null;
}

/** Slugs and dates of published stories, for static params and the sitemap. */
export async function getPublishedStoryRefs() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "success-stories",
    ...publicAccess,
    depth: 0,
    limit: 1000,
    select: { slug: true, updatedAt: true },
  });
  return docs.map(({ slug, updatedAt }) => ({ slug, updatedAt }));
}
