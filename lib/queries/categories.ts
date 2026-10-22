import { getPayloadClient } from "@/lib/payload";

/** All categories, ordered for display. Categories are public content. */
export async function getCategories() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "categories",
    overrideAccess: false,
    depth: 0,
    limit: 200,
    sort: ["sortOrder", "title"],
    select: { title: true, slug: true, parent: true },
  });
  return docs;
}
