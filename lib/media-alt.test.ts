import { describe, expect, it } from "vitest";

import { altFromFilename } from "./media-alt";

describe("altFromFilename", () => {
  it("removes the extension and turns special characters into spaces", () => {
    expect(altFromFilename("Hero_jewelry-store.jpeg")).toBe("Hero jewelry store");
  });

  it("collapses runs of special characters and trims the ends", () => {
    expect(altFromFilename("__Hero_ liqueur__store!!.JPG")).toBe("Hero liqueur store");
  });

  it("removes only the last extension", () => {
    expect(altFromFilename("factory.tour.v2.mp4")).toBe("factory tour v2");
  });

  it("keeps digits and accented letters", () => {
    expect(altFromFilename("Café-mug_2026.png")).toBe("Café mug 2026");
  });

  it("handles a name without an extension", () => {
    expect(altFromFilename("tote(bag)")).toBe("tote bag");
  });
});
