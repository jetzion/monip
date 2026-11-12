import { readFile } from "node:fs/promises";

import type { CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { measureContentBox } from "./content-box";
import { readStoredMedia } from "./stored-file";

const MEASURABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** The image being saved: the upload when the server holds all of it, otherwise the stored file. */
async function imageBytes(req: PayloadRequest, filename: string, filesize: number | undefined, staticDir: string) {
  const file = req.file as (NonNullable<PayloadRequest["file"]> & { tempFilePath?: string }) | undefined;
  if (file?.tempFilePath) return readFile(file.tempFilePath);
  // Browser uploads to Blob send only part of the file; it is already stored by then.
  if (file?.data?.length && file.data.length === filesize) return file.data;
  return readStoredMedia(filename, staticDir);
}

/**
 * Records where the product sits in a new image (`contentBox`), so product
 * cards and pages can frame it consistently. Skipped when the saved image
 * differs from the measured one (e.g. cropped in the admin): it then shows unframed.
 */
export const measureContentBoxHook: CollectionBeforeChangeHook = async ({ collection, data, originalDoc, req }) => {
  const filename: string | undefined = data.filename ?? originalDoc?.filename;
  const mimeType: string | undefined = data.mimeType ?? originalDoc?.mimeType;
  if (!filename || !mimeType || !MEASURABLE.has(mimeType)) return data;
  const newFile = Boolean(req.file) || filename !== originalDoc?.filename;
  if (!newFile && originalDoc?.contentBox?.width) return data;

  try {
    const staticDir = collection.upload ? collection.upload.staticDir ?? "media" : "media";
    const measured = await measureContentBox(await imageBytes(req, filename, data.filesize ?? originalDoc?.filesize, staticDir));
    const width = data.width ?? originalDoc?.width;
    const height = data.height ?? originalDoc?.height;
    data.contentBox = measured.width === width && measured.height === height ? measured.box : null;
  } catch (error) {
    // The image still saves; it shows unframed until measured again.
    req.payload.logger.error({ err: error, msg: `Could not measure ${filename}` });
  }
  return data;
};
