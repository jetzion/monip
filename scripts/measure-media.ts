/**
 * Measures where the product sits in each image that has no content box yet.
 * Production does this in the media_content_box migration; use this locally.
 * Run with: pnpm payload run scripts/measure-media.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

import { measureExistingMedia } from "../lib/media/measure-existing";

const payload = await getPayload({ config });
const count = await measureExistingMedia(payload);
const { totalDocs } = await payload.count({ collection: "media", where: { "contentBox.width": { exists: true } } });
console.log(`Re-saved ${count} media items; ${totalDocs} now have a content box.`);
await payload.destroy();
process.exit(0);
