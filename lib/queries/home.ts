import { getPayloadClient } from "@/lib/payload";
import { publicAccess, type ContentAccess } from "@/lib/queries/products";

/** Homepage copy and hero media (depth 1); unsaved fields fall back to the defaults in globals/Home.ts. */
export async function getHomeContent(access: ContentAccess = publicAccess) {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "home", ...access, depth: 1 });
}
