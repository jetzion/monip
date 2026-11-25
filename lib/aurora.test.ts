import { describe, expect, it } from "vitest";

import { auroraStyle } from "./aurora";

describe("auroraStyle", () => {
  it("sets nothing without colours", () => {
    expect(auroraStyle(null)).toEqual({});
    expect(auroraStyle({ base: null, clouds: "", highlights: undefined })).toEqual({});
  });

  it("maps base, clouds, and highlights to the band's variables", () => {
    expect(auroraStyle({ base: "#ffffff", clouds: "#112233", highlights: "#445566" })).toEqual({
      "--aurora-base": "#ffffff",
      "--aurora-1": "#112233",
      "--aurora-2": "#112233",
      "--aurora-3": "#112233",
      "--aurora-4": "#112233",
      "--aurora-5": "#445566",
      "--aurora-6": "#445566",
      "--aurora-7": "#445566",
    });
  });

  it("keeps the built-in shade for unset colours", () => {
    expect(auroraStyle({ base: "#ffffff" })).toEqual({ "--aurora-base": "#ffffff" });
  });
});
