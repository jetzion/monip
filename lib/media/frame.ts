/** Where the product sits in its photo, as fractions (0-1) of the image width and height. */
export type ContentBox = { left: number; top: number; width: number; height: number };

/** Space left around the product inside its frame, as a fraction of each side. */
export const FRAME_MARGIN = 0.08;
/** Frame shape (width / height) for product cards and the product page. */
export const FRAME_ASPECT = 4 / 3;

/**
 * Size and position of the image, in percent of the frame, so that its content
 * box fills the frame minus the margin, centred, without distortion.
 */
export function framedImageStyle(box: ContentBox, imageWidth: number, imageHeight: number, margin = FRAME_MARGIN) {
  const inner = 1 - 2 * margin;
  const contentAspect = (box.width * imageWidth) / (box.height * imageHeight);
  // Content size as a fraction of the frame: fills the width or the height.
  const contentWidth = contentAspect > FRAME_ASPECT ? inner : (inner * contentAspect) / FRAME_ASPECT;
  const contentHeight = contentAspect > FRAME_ASPECT ? (inner * FRAME_ASPECT) / contentAspect : inner;
  const width = contentWidth / box.width;
  const height = contentHeight / box.height;
  const percent = (value: number) => `${(value * 100).toFixed(3)}%`;
  return {
    left: percent((1 - contentWidth) / 2 - box.left * width),
    top: percent((1 - contentHeight) / 2 - box.top * height),
    width: percent(width),
    height: percent(height),
  };
}

/** Scales each width in an `<img sizes>` value, for an image drawn larger than its frame. */
export function scaleSizes(sizes: string, factor: number) {
  // Only the width at the end of each entry, not the media condition before it.
  return sizes.replace(/(\d+(?:\.\d+)?)(vw|px)\s*(?=,|$)/g, (_, value: string, unit: string) => `${Math.ceil(Number(value) * factor)}${unit}`);
}

/** The stored content box, if it is complete. */
export function completeBox(box: Partial<Record<keyof ContentBox, number | null>> | null | undefined): ContentBox | null {
  const { left, top, width, height } = box ?? {};
  if (left == null || top == null || !width || !height) return null;
  return { left, top, width, height };
}
