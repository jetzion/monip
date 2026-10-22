import { expect, test, type Page } from "@playwright/test";

/**
 * Requires seeded placeholders: Category A has products 1-3 (1 and 2 in
 * Subcategory A1); Category B has products 4-5.
 */
const cards = (page: Page) => page.getByRole("main").getByRole("article");

test("all products show by default", async ({ page }) => {
  await page.goto("/products");
  await expect(cards(page)).toHaveCount(5);
  await expect(page.getByRole("status").filter({ hasText: "5 products" })).toBeVisible();
});

test("filters by category and subcategory", async ({ page }) => {
  await page.goto("/products");
  const categories = page.getByRole("navigation", { name: "Product categories" });

  await categories.getByRole("link", { name: "Placeholder Category A" }).click();
  await expect(page).toHaveURL(/category=placeholder-category-a/);
  await expect(cards(page)).toHaveCount(3);

  await categories.getByRole("link", { name: "Placeholder Subcategory A1" }).click();
  await expect(page).toHaveURL(/category=placeholder-subcategory-a1/);
  await expect(cards(page)).toHaveCount(2);
  await expect(
    page.getByRole("status").filter({ hasText: "2 products in Placeholder Subcategory A1" }),
  ).toBeVisible();
});

test("searches by keyword and keeps the search when changing category", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("searchbox", { name: "Search products" }).fill("product 4");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=product\+4/);
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Placeholder Product 4" })).toBeVisible();

  const categories = page.getByRole("navigation", { name: "Product categories" });
  await categories.getByRole("link", { name: "Placeholder Category A" }).click();
  await expect(page).toHaveURL(/q=product\+4&category=placeholder-category-a/);
  await expect(cards(page)).toHaveCount(0);
});

test("shows a helpful empty state and clears filters", async ({ page }) => {
  await page.goto("/products?q=zzzz-no-match");
  await expect(page.getByText("No products match your search.")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(cards(page)).toHaveCount(5);
});

test("unknown category shows a message instead of an error", async ({ page }) => {
  const response = await page.goto("/products?category=does-not-exist");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("That category does not exist.")).toBeVisible();
});
