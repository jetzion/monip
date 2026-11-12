import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { measureContentBox } from "./content-box";
import { FRAME_MARGIN, framedImageStyle, scaleSizes } from "./frame";

const white = { r: 255, g: 255, b: 255 };

/** A white image with a red rectangle at the given position. */
async function photo(width: number, height: number, rect: { left: number; top: number; width: number; height: number }) {
  const red = await sharp({ create: { width: rect.width, height: rect.height, channels: 3, background: { r: 200, g: 0, b: 0 } } })
    .png()
    .toBuffer();
  return sharp({ create: { width, height, channels: 3, background: white } })
    .composite([{ input: red, left: rect.left, top: rect.top }])
    .png()
    .toBuffer();
}

const pct = (value: string) => Number.parseFloat(value) / 100;

describe("measureContentBox", () => {
  it("finds the product inside a white background", async () => {
    const { box, width, height } = await measureContentBox(await photo(1000, 800, { left: 300, top: 200, width: 200, height: 400 }));
    expect(box.left).toBeCloseTo(0.3, 2);
    expect(box.top).toBeCloseTo(0.25, 2);
    expect(box.width).toBeCloseTo(0.2, 2);
    expect(box.height).toBeCloseTo(0.5, 2);
    expect([width, height]).toEqual([1000, 800]);
  });

  it("returns the whole image when there is no white background", async () => {
    const { box } = await measureContentBox(await photo(400, 300, { left: 0, top: 0, width: 400, height: 300 }));
    expect(box).toEqual({ left: 0, top: 0, width: 1, height: 1 });
  });
});

describe("framedImageStyle", () => {
  const inner = 1 - 2 * FRAME_MARGIN;

  it("fits a wide product to the frame width, centred", () => {
    // Content 600x200 px (3:1) at (200, 400) in a 1000x1000 image.
    const style = framedImageStyle({ left: 0.2, top: 0.4, width: 0.6, height: 0.2 }, 1000, 1000);
    const width = pct(style.width);
    expect(width * 0.6).toBeCloseTo(inner, 5);
    expect(pct(style.left) + 0.2 * width).toBeCloseTo(FRAME_MARGIN, 5);
    // Vertically centred: content height is (inner * 4/3) / 3 of the frame.
    const contentHeight = (inner * 4) / 3 / 3;
    expect(pct(style.top) + 0.4 * pct(style.height)).toBeCloseTo((1 - contentHeight) / 2, 5);
  });

  it("fits a tall product to the frame height, centred", () => {
    const style = framedImageStyle({ left: 0.4, top: 0.1, width: 0.2, height: 0.8 }, 1000, 1000);
    const height = pct(style.height);
    expect(height * 0.8).toBeCloseTo(inner, 5);
    expect(pct(style.top) + 0.1 * height).toBeCloseTo(FRAME_MARGIN, 5);
  });

  it("keeps the image's own aspect ratio", () => {
    // In a 4:3 frame, a 2000x1000 image must render twice as wide as tall in pixels.
    const style = framedImageStyle({ left: 0.1, top: 0.2, width: 0.5, height: 0.3 }, 2000, 1000);
    expect((pct(style.width) * 4) / (pct(style.height) * 3)).toBeCloseTo(2, 5);
  });
});

describe("scaleSizes", () => {
  it("scales vw and px widths but not media query conditions", () => {
    expect(scaleSizes("(min-width: 1024px) 33vw, 100vw", 2)).toBe("(min-width: 1024px) 66vw, 200vw");
  });
});
