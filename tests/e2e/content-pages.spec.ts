import { expect, test } from "@playwright/test";

/** Requires published services and the About and Privacy pages (pnpm seed creates placeholders). */
test("services page lists published services", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  // Each service in the jump links has a matching section heading.
  const links = page.getByRole("navigation", { name: "Services on this page" }).getByRole("link");
  const titles = await links.allInnerTexts();
  expect(titles.length).toBeGreaterThan(0);
  for (const title of titles) {
    await expect(page.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible();
  }
});

test("About page is linked from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1, name: /^About/ })).toBeVisible();
});

test("About shows each published office on the map and in the list", async ({ page }) => {
  await page.goto("/about");
  const offices = page.getByRole("region", { name: "Our offices" });
  const names = await offices.getByRole("listitem").locator("p.font-semibold").allInnerTexts();
  expect(names.length).toBeGreaterThan(0);
  const map = offices.getByRole("img", { name: /^World map showing MONIP Group offices in / });
  await expect(map).toHaveAttribute("aria-label", `World map showing MONIP Group offices in ${names.join(", ")}`);
});

test("Our clients page is linked from the header and logos have alt text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Clients", exact: true }).click();
  await expect(page).toHaveURL(/\/clients$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Our clients/ })).toBeVisible();
  for (const logo of await page.getByRole("list", { name: "Client logos" }).getByRole("img").all()) {
    await expect(logo).toHaveAttribute("alt", /\S/);
  }
});

test("sustainability page is removed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sustainability" })).toHaveCount(0);
  expect((await page.request.get("/sustainability")).status()).toBe(404);
});

test("privacy policy is linked from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Privacy policy/ })).toBeVisible();
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
