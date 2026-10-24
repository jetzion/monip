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
    select: { title: true, headline: true, intro: true, image: true, body: true, seo: true },
    populate: { media: { url: true, filename: true, alt: true, width: true, height: true } },
  });
  return docs[0] ?? null;
}

/** Which optional sections have published content (deduplicated per render). */
export const getAvailableSections = cache(async () => {
  const payload = await getPayloadClient();
  const [services, stories, pages] = await Promise.all([
    payload.count({ collection: "services", ...publicAccess }),
    payload.count({ collection: "success-stories", ...publicAccess }),
    payload.find({ collection: "pages", ...publicAccess, depth: 0, limit: 10, select: { key: true } }),
  ]);
  const keys = new Set(pages.docs.map((page) => page.key));
  return {
    services: services.totalDocs > 0,
    about: keys.has("about"),
    clients: keys.has("clients"),
    // The page needs both its header (Pages) and at least one published story.
    "success-stories": keys.has("success-stories") && stories.totalDocs > 0,
    privacy: keys.has("privacy"),
  };
});

export async function getPublishedClients(access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "clients",
    ...access,
    depth: 1,
    limit: 100,
    sort: "_order",
    select: { name: true, logo: true },
    populate: { media: { url: true, filename: true, alt: true, width: true, height: true } },
  });
  return docs;
}

export async function getPublishedOffices(access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "offices",
    ...access,
    depth: 0,
    limit: 50,
    sort: ["sortOrder", "name"],
    select: { name: true, address: true, latitude: true, longitude: true },
  });
  return docs;
}
