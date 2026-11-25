import { expect, test } from "@playwright/test";

test("homepage shows the 4 most recently published featured products, four across", async ({ page, request }) => {
  const response = await request.get("/api/products?where[featured][equals]=true&sort=-publishedAt&limit=4&depth=0");
  const names = ((await response.json()) as { docs: { name: string }[] }).docs.map((doc) => doc.name);
  expect(names.length).toBeGreaterThan(0);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const cards = page.getByRole("region", { name: "Featured products" }).getByRole("article");
  await expect(cards.getByRole("heading")).toHaveText(names);
  if (names.length === 4) {
    const tops = await cards.evaluateAll((all) => all.map((card) => card.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
  }
});

test("header call to action opens the contact page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Discuss a project" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { level: 1, name: "Discuss a project" })).toBeVisible();
});

/** Requires the published Home page global (migration or pnpm seed). */
test("homepage shows the published CMS copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merchandising and product sourcing for business");
});

test("a Discuss a project button under the products opens the contact page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Have a product or program in mind?")).toHaveCount(0);
  await page.getByRole("main").getByRole("link", { name: "Discuss a project" }).last().click();
  await expect(page).toHaveURL(/\/contact$/);
});

test("hero buttons open the products and contact pages", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("main").locator("section").first();
  await expect(hero.getByRole("link", { name: "Discuss a project" })).toHaveAttribute("href", "/contact");
  await hero.getByRole("link", { name: "Explore products" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("homepage scrolls all published client logos and pauses on hover", async ({ page, request }) => {
  const response = await request.get("/api/clients?limit=0&depth=0");
  const total = ((await response.json()) as { totalDocs: number }).totalDocs;
  expect(total).toBeGreaterThan(0);

  await page.goto("/");
  const band = page.getByRole("region", { name: "Our clients" });
  // Fewer than 8 logos are repeated to fill the strip; the second (moving) copy is hidden from assistive tech.
  await expect(band.getByRole("listitem")).toHaveCount(total * Math.ceil(8 / total));
  const track = band.locator(".logo-marquee-track");
  await expect(track).toHaveCSS("animation-play-state", "running");
  await band.locator(".logo-marquee").hover();
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await page.mouse.move(0, 0);
  await expect(track).toHaveCSS("animation-play-state", "running");
  await expect(band.getByRole("button")).toHaveCount(0);
  await expect(band.getByRole("link")).toHaveCount(0);
});

test("client logos stand still with reduced motion", async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto("/");
  const band = page.getByRole("region", { name: "Our clients" });
  await expect(band.locator(".logo-marquee-track")).toHaveCSS("animation-name", "none");
  await page.close();
});

test("hero links to the About page for more detail", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "More about MONIP Group" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1, name: /^About/ })).toBeVisible();
});

test("visitor submits the general contact form", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("e2e-visitor@example.com");
  await page.getByLabel("Message").fill("E2E general inquiry about a program.");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(page.getByRole("status")).toHaveText(/We received your inquiry and will reply/);
});

test("header stays visible after scrolling", async ({ page }) => {
  await page.goto("/");
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const box = await page.getByRole("banner").boundingBox();
  expect(box?.y).toBe(0);
});

// How we work cards use the same name size (checked in home-process.spec.ts, which controls that section's data).
test("home product cards use the compact name size and show no category tag", async ({ page }) => {
  await page.goto("/");
  const name = page.getByRole("region", { name: "Featured products" }).getByRole("article").first().getByRole("heading");
  expect(await name.evaluate((el) => getComputedStyle(el).fontSize)).toBe("17px");
  await expect(page.getByRole("region", { name: "Featured products" }).locator("article p.rounded-full")).toHaveCount(0);
});
