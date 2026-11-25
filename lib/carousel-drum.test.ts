import { describe, expect, it } from "vitest";

import { drumPlace } from "./carousel-drum";

describe("drumPlace", () => {
  it("leaves the centre card flat, in front, and fully visible", () => {
    expect(drumPlace(0, 300)).toEqual({ x: 0, z: 0, rotate: 0, opacity: 1, shade: 1 });
  });

  it("turns side cards away and pushes them back, mirrored left and right", () => {
    const right = drumPlace(1, 300);
    const left = drumPlace(-1, 300);
    expect(right.rotate).toBe(24);
    expect(left.rotate).toBe(-24);
    expect(right.z).toBeLessThan(0);
    expect(left.z).toBeCloseTo(right.z);
    expect(left.x).toBeCloseTo(-right.x);
  });

  it("pulls outer cards in and further back than their neighbours", () => {
    const near = drumPlace(1, 300);
    const outer = drumPlace(2, 300);
    expect(outer.z).toBeLessThan(near.z);
    expect(outer.x).toBeLessThan(near.x);
    expect(outer.shade).toBeLessThan(near.shade);
  });

  it("shows up to two cards each side and hides the back of the drum", () => {
    expect(drumPlace(2, 300).opacity).toBe(1);
    expect(drumPlace(-2.7, 300).opacity).toBe(0);
    expect(drumPlace(4, 300).opacity).toBe(0);
  });
});
