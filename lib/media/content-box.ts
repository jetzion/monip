import sharp from "sharp";

import type { ContentBox } from "./frame";

/** Colour difference still treated as white background (sharp's trim threshold). */
const WHITE_THRESHOLD = 20;

/**
 * Finds the product inside its white background (the whole image if there is
 * none to trim). Also returns the image size as displayed (after EXIF rotation).
 */
export async function measureContentBox(image: Buffer): Promise<{ box: ContentBox; width: number; height: number }> {
  // Rotate first so the box matches the image as browsers display it.
  const oriented = await sharp(image).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = oriented.info;
  const { info } = await sharp(oriented.data)
    .trim({ background: "#ffffff", threshold: WHITE_THRESHOLD })
    .toBuffer({ resolveWithObject: true });
  // sharp reports the trimmed edges as negative offsets.
  const left = Math.abs(info.trimOffsetLeft ?? 0);
  const top = Math.abs(info.trimOffsetTop ?? 0);
  return {
    box: { left: left / width, top: top / height, width: info.width / width, height: info.height / height },
    width,
    height,
  };
}
