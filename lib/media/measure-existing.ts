import type { Payload, PayloadRequest } from "payload";

/**
 * Measures media saved before `contentBox` existed. Re-saving without changes
 * runs the Media hook, which measures images that have no box yet.
 */
export async function measureExistingMedia(payload: Payload, req?: Partial<PayloadRequest>) {
  const { docs } = await payload.find({
    collection: "media",
    where: { "contentBox.width": { exists: false } },
    limit: 0,
    depth: 0,
    select: { filename: true },
    req,
  });
  for (const doc of docs) {
    await payload.update({ collection: "media", id: doc.id, data: {}, depth: 0, req });
  }
  return docs.length;
}
