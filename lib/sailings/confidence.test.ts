import { describe, expect, it } from "vitest";

import { confidenceTone } from "./confidence";

describe("confidenceTone", () => {
  it("groups the workbook's values", () => {
    expect(confidenceTone("confirmed")).toBe("confirmed");
    expect(confidenceTone(" Unconfirmed ")).toBe("unconfirmed");
    expect(confidenceTone("pattern")).toBe("pattern");
    expect(confidenceTone("from your MSC calendar")).toBe("calendar");
  });

  it("treats anything else as other", () => {
    expect(confidenceTone("maybe")).toBe("other");
    expect(confidenceTone("unconfirmed?")).toBe("other");
  });
});
