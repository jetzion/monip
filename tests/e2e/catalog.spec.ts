import { expect, test } from "@playwright/test";

/** Requires seeded placeholder products (pnpm seed). */
test("visitor browses the catalog and opens a product", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();

  // Product names are editable, so follow the card by URL and compare names.
  const card = page.locator('a[href="/products/placeholder-product-1"]');
  const name = (await card.innerText()).trim();
  await card.click();
  await expect(page).toHaveURL(/\/products\/placeholder-product-1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
});

test("unknown product shows the not-found page", async ({ page }) => {
  const response = await page.goto("/products/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
