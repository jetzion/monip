import { expect, test } from "@playwright/test";

/** Requires seeded placeholder products (pnpm seed); 1, 2, and 4 are featured. */
test("homepage shows featured products only", async ({ page }) => {
  await page.goto("/");
  const featured = page.getByRole("region", { name: "Featured products" });
  await expect(featured.getByRole("article")).toHaveCount(3);
  await expect(featured.getByRole("link", { name: "Placeholder Product 3" })).toHaveCount(0);
});

test("header call to action opens the contact page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Discuss a project" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { level: 1, name: "Discuss a project" })).toBeVisible();
});

test("visitor submits the general contact form", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("e2e-visitor@example.com");
  await page.getByLabel("Message").fill("E2E general inquiry about a program.");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(page.getByRole("status")).toHaveText(/We received your inquiry and will reply/);
});

test("hero background video can be paused and resumed", async ({ page }) => {
  await page.goto("/");
  const video = page.locator("video");
  await expect(video).toHaveAttribute("poster", "/hero/decoration-poster.jpg");
  await page.getByRole("button", { name: "Pause background video" }).click();
  await expect(page.getByRole("button", { name: "Play background video" })).toBeVisible();
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test("header stays visible after scrolling", async ({ page }) => {
  await page.goto("/sustainability");
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const box = await page.getByRole("banner").boundingBox();
  expect(box?.y).toBe(0);
});
