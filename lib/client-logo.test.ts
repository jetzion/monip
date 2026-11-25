import { describe, expect, it } from "vitest";

import type { Media } from "@/payload-types";

import { logoHeight } from "./client-logo";

const logo = (width: number, height: number) => ({ width, height }) as Media;

describe("logoHeight", () => {
  it("makes a 3:1 logo 46px tall", () => {
    expect(logoHeight(logo(300, 100))).toBe(46);
  });

  it("caps tall logos at 88px", () => {
    expect(logoHeight(logo(100, 300))).toBe(88);
  });

  it("uses the cap when the size is unknown", () => {
    expect(logoHeight(null)).toBe(88);
  });

  it("scales the height", () => {
    expect(logoHeight(logo(300, 100), 0.75)).toBe(35);
    expect(logoHeight(null, 0.75)).toBe(66);
  });
});
