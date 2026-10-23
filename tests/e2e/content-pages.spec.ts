import { expect, test } from "@playwright/test";

/** Requires seeded placeholders (pnpm seed): 3 services and all three pages. */
test("services page lists published services", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading", { level: 2, name: /Placeholder Service/ })).toHaveCount(3);
});

for (const { path, link, heading } of [
  { path: "/about", link: "About", heading: /^About/ },
  { path: "/sustainability", link: "Sustainability", heading: /^Sustainability/ },
]) {
  test(`${link} page is linked from the header`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("privacy policy is linked from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Privacy policy (placeholder)" })).toBeVisible();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu opens, navigates, and closes", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

    await page.locator("#mobile-nav").getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator("#mobile-nav")).toHaveCount(0);
  });

  test("Escape closes the menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav")).toHaveCount(0);
  });
});

test("main navigation marks the current section", async ({ page }) => {
  const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
  await page.goto("/");
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

  await page.goto("/products/placeholder-product-1");
  await expect(nav.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
});
