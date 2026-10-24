import { describe, expect, it } from "vitest";

import { labelOnLeft, MAP, mapImageBox, mapPosition, VIEW, viewHeight } from "./offices-map";

describe("mapPosition", () => {
  it("maps the cropped view's corners and the equator", () => {
    expect(mapPosition({ latitude: VIEW.north, longitude: -180 })).toEqual({ left: 0, top: 0 });
    expect(mapPosition({ latitude: VIEW.south, longitude: 180 })).toEqual({ left: 100, top: 100 });
    expect(mapPosition({ latitude: 0, longitude: 0 }).left).toBe(50);
    expect(mapPosition({ latitude: 0, longitude: 0 }).top).toBeCloseTo((72 / 130) * 100, 5);
  });
});

describe("mapImageBox", () => {
  it("places the full map so a latitude lands at the same spot as its pin", () => {
    // Pixel position of the equator inside the full SVG, converted to view percentages.
    const equatorInSvg = (MAP.north / 360) * MAP.width;
    const viaImage = mapImageBox.top + (equatorInSvg / MAP.height) * mapImageBox.height;
    expect(viaImage).toBeCloseTo(mapPosition({ latitude: 0, longitude: 0 }).top, 5);
    expect(viewHeight).toBeLessThan(MAP.height);
  });
});

describe("labelOnLeft", () => {
  const miami = { latitude: 25.8, longitude: -80.2 };
  const mexicoCity = { latitude: 19.4, longitude: -99.1 };
  const all = [miami, mexicoCity];

  it("puts the label left when a neighbour is just to the east", () => {
    expect(labelOnLeft(mexicoCity, all)).toBe(true);
    expect(labelOnLeft(miami, all)).toBe(false);
  });
});
