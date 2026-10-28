import { describe, expect, it } from "vitest";

import { invitationQuestion, type InvitationSettings } from "./question";

const q = (...list: string[]) => list.map((question) => ({ question }));

const settings: InvitationSettings = {
  enabled: true,
  questions: { home: q("H1?", "H2?"), product: q("P1?", "P2?") },
  picks: { home: "H2?" },
};

describe("invitationQuestion", () => {
  it("returns null when switched off", () => {
    expect(invitationQuestion({ ...settings, enabled: false }, "home")).toBeNull();
  });

  it("returns null for a page without questions", () => {
    expect(invitationQuestion(settings, "services")).toBeNull();
  });

  it("uses the AI's pick for a fixed page", () => {
    expect(invitationQuestion(settings, "home")).toBe("H2?");
  });

  it("uses the detail page's own pick", () => {
    expect(invitationQuestion(settings, "product", "P2?")).toBe("P2?");
  });

  it("falls back to the first question when there is no pick or it was removed", () => {
    expect(invitationQuestion(settings, "product")).toBe("P1?");
    expect(invitationQuestion(settings, "product", "Removed?")).toBe("P1?");
    expect(invitationQuestion({ ...settings, picks: { home: "Removed?" } }, "home")).toBe("H1?");
  });
});
