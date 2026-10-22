import { describe, expect, it } from "vitest";

import { affectsPublicSite } from "./publish-state";

const draft = { _status: "draft" } as const;
const published = { _status: "published" } as const;

describe("affectsPublicSite", () => {
  it("ignores draft saves of unpublished documents (autosave)", () => {
    expect(affectsPublicSite(draft, draft)).toBe(false);
    expect(affectsPublicSite(draft, undefined)).toBe(false);
  });

  it("counts publishing", () => {
    expect(affectsPublicSite(published, draft)).toBe(true);
    expect(affectsPublicSite(published, published)).toBe(true);
  });

  it("counts unpublishing", () => {
    expect(affectsPublicSite(draft, published)).toBe(true);
  });

  it("counts documents without drafts", () => {
    expect(affectsPublicSite({}, {})).toBe(true);
  });
});
