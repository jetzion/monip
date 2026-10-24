import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** WCAG 2.x A/AA rules, including 2.2. Requires seeded placeholders. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
  }));
  expect(summary).toEqual([]);
}

const PAGES = [
  "/",
  "/products",
  "/products?category=placeholder-category-a",
  "/products?q=zzzz-no-match",
  "/products/placeholder-product-1",
  "/services",
  "/success-stories",
  "/success-stories/placeholder-story-1",
  "/about",
  "/clients",
  "/privacy",
  "/contact",
  "/does-not-exist",
  "/products/does-not-exist",
];

for (const path of PAGES) {
  test(`no WCAG violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test("no WCAG violations with the chat panel open on desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with us" }).click();
  await expectNoViolations(page);
});

test("no WCAG violations in the inquiry form error state", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Check the highlighted fields.")).toBeVisible();
  await expectNoViolations(page);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no WCAG violations with the menu open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expectNoViolations(page);
  });

  test("no WCAG violations with the chat panel open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Chat with us" }).click();
    await expectNoViolations(page);
  });
});
