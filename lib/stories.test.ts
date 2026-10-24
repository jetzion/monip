import { describe, expect, it } from "vitest";

import { formatStoryDate, visibleCustomer } from "./stories";

describe("visibleCustomer", () => {
  it("hides the name until the customer is approved", () => {
    expect(visibleCustomer({ customerName: "Acme", customerApproved: false })).toBeNull();
    expect(visibleCustomer({ customerName: "Acme", customerApproved: null })).toBeNull();
  });

  it("shows an approved, non-empty name", () => {
    expect(visibleCustomer({ customerName: " Acme ", customerApproved: true })).toBe("Acme");
    expect(visibleCustomer({ customerName: "  ", customerApproved: true })).toBeNull();
  });
});

describe("formatStoryDate", () => {
  it("formats in UTC so the day does not shift", () => {
    expect(formatStoryDate("2026-10-24T00:00:00.000Z")).toBe("October 24, 2026");
  });

  it("returns null without a date", () => {
    expect(formatStoryDate(null)).toBeNull();
  });
});
