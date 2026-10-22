import { expect, test } from "@playwright/test";

test("preview requires an admin login", async ({ request }) => {
  const response = await request.get("/preview?path=/products/placeholder-product-1", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(401);
});

test("preview refuses unsafe redirect paths", async ({ request }) => {
  for (const path of ["//evil.example", "https://evil.example", "/products?x=1"]) {
    const response = await request.get(`/preview?path=${encodeURIComponent(path)}`, {
      maxRedirects: 0,
    });
    expect(response.status(), path).toBe(400);
  }
});

test("public pages show no preview banner", async ({ page }) => {
  await page.goto("/products/placeholder-product-1");
  await expect(page.getByText("Preview mode.")).toHaveCount(0);
});
