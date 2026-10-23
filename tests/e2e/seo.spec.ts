import { expect, test } from "@playwright/test";

test("robots.txt keeps admin and API out of search engines", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain("Disallow: /api");
  expect(body).toContain("/sitemap.xml");
});

test("sitemap lists published products", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body).toContain("/products/placeholder-product-1</loc>");
  expect(body).not.toContain("/admin");
});

test("product pages have a canonical URL and social metadata", async ({ page }) => {
  await page.goto("/products/placeholder-product-1");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/products\/placeholder-product-1$/,
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "MONIP Group");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/api\/media\/file\/.+\.(png|jpe?g|webp)$/);
});
