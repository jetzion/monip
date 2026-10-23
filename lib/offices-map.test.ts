import { describe, expect, it } from "vitest";

import { labelOnLeft, mapPosition } from "./offices-map";

describe("mapPosition", () => {
  it("maps the map corners and the equator", () => {
    expect(mapPosition({ latitude: 84, longitude: -180 })).toEqual({ left: 0, top: 0 });
    expect(mapPosition({ latitude: 0, longitude: 0 }).left).toBe(50);
    expect(mapPosition({ latitude: 0, longitude: 0 }).top).toBeCloseTo((84 / 142) * 100, 0);
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
