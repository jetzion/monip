import { cache } from "react";

import type { PageKey } from "@/collections/Pages";
import { getPayloadClient } from "@/lib/payload";
import { publicAccess, type ContentAccess } from "@/lib/queries/products";

export async function getPublishedServices(access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "services",
    ...access,
    depth: 1,
    limit: 50,
    sort: ["sortOrder", "title"],
    select: { title: true, slug: true, summary: true, body: true, image: true },
    populate: { media: { url: true, filename: true, alt: true, width: true, height: true } },
  });
  return docs;
}

export async function getPage(key: PageKey, access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "pages",
    ...access,
    depth: 1,
    limit: 1,
    where: { key: { equals: key } },
    select: { title: true, intro: true, image: true, body: true, seo: true },
    populate: { media: { url: true, filename: true, alt: true, width: true, height: true } },
  });
  return docs[0] ?? null;
}

/** Which optional sections have published content (deduplicated per render). */
export const getAvailableSections = cache(async () => {
  const payload = await getPayloadClient();
  const [services, pages] = await Promise.all([
    payload.count({ collection: "services", ...publicAccess }),
    payload.find({ collection: "pages", ...publicAccess, depth: 0, limit: 10, select: { key: true } }),
  ]);
  const keys = new Set(pages.docs.map((page) => page.key));
  return {
    services: services.totalDocs > 0,
    about: keys.has("about"),
    sustainability: keys.has("sustainability"),
    privacy: keys.has("privacy"),
  };
});
