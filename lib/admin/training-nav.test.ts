import { describe, expect, it } from "vitest";

import { currentTab, trainingTabs } from "./training-nav";

describe("trainingTabs", () => {
  it("shows Costs to admins only", () => {
    expect(trainingTabs("admin").map((tab) => tab.label)).toContain("Costs");
    expect(trainingTabs("trainer").map((tab) => tab.label)).not.toContain("Costs");
    expect(trainingTabs("trainer")[0].label).toBe("Schedule");
  });
});

describe("currentTab", () => {
  const tabs = trainingTabs("admin");

  it("matches a tab's page and the pages under it", () => {
    expect(currentTab("/admin/training-report", "/admin", tabs)?.label).toBe("Report");
    expect(currentTab("/admin/collections/trainers/4", "/admin", tabs)?.label).toBe("Trainers");
  });

  it("does not match a page that only starts with the same letters", () => {
    expect(currentTab("/admin/collections/trainers-old", "/admin", tabs)).toBeUndefined();
    expect(currentTab("/admin/collections/products", "/admin", tabs)).toBeUndefined();
  });
});
