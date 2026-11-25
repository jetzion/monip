import { expect, test, type APIRequestContext } from "@playwright/test";

const featuredNames = async (request: APIRequestContext) => {
  const response = await request.get("/api/products?where[featured][equals]=true&sort=-publishedAt&limit=12&depth=0");
  return ((await response.json()) as { docs: { name: string; slug: string }[] }).docs;
};

test("homepage rolls up to 12 featured products, newest first, the centre card in front of a turning drum", async ({ page, request }) => {
  const products = await featuredNames(request);
  // The carousel needs at least 6; fewer show as a grid.
  expect(products.length).toBeGreaterThanOrEqual(6);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const carousel = page.getByRole("group", { name: "Featured products" });
  await expect(carousel.getByRole("article").getByRole("heading")).toHaveText(products.map((product) => product.name));
  // On a drum: the centre card faces the viewer, neighbours turn 24 degrees, outer cards 48
  // (the last slide sits left of the first).
  const angles = await carousel
    .locator("li[aria-roledescription=slide]")
    .evaluateAll((lis) => lis.map((li) => Number.parseFloat(li.style.getPropertyValue("--ry"))));
  for (const [index, angle] of [[0, 0], [1, 24], [2, 48], [angles.length - 1, -24]]) {
    expect(Math.abs(angles[index] - angle)).toBeLessThan(1);
  }

  await expect(carousel.getByRole("button", { name: "Show product 1", exact: true })).toHaveAttribute("aria-current", "true");
  // Default: the next product every 5 seconds.
  await expect(carousel.getByRole("button", { name: "Show product 2", exact: true })).toHaveAttribute("aria-current", "true", { timeout: 8000 });
});

test("visitors can pause the carousel, step through it, and open a product", async ({ page, request }) => {
  const products = await featuredNames(request);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const carousel = page.getByRole("group", { name: "Featured products" });
  // Pointing at it holds it still.
  await carousel.hover();
  await page.waitForTimeout(6000);
  await expect(carousel.getByRole("button", { name: "Show product 1", exact: true })).toHaveAttribute("aria-current", "true");
  // Leaving it rolls on at once, without waiting a full turn.
  await page.mouse.move(0, 0);
  await expect(carousel.getByRole("button", { name: "Show product 2", exact: true })).toHaveAttribute("aria-current", "true", { timeout: 2000 });
  await carousel.hover();
  await carousel.getByRole("button", { name: "Pause featured products" }).click();
  await carousel.getByRole("button", { name: "Play featured products" }).click();
  // Playing again rolls on at once and runs the countdown, with the pointer still on the button.
  await expect(carousel.getByRole("button", { name: "Show product 3", exact: true })).toHaveAttribute("aria-current", "true", { timeout: 2000 });
  await expect(carousel.locator(".carousel-countdown")).toHaveCSS("animation-play-state", "running");
  await carousel.getByRole("button", { name: "Pause featured products" }).click();
  await expect(carousel.getByRole("button", { name: "Play featured products" })).toBeVisible();
  await carousel.getByRole("button", { name: "Next product" }).click();
  await expect(carousel.getByRole("button", { name: "Show product 4", exact: true })).toHaveAttribute("aria-current", "true");
  await carousel.getByRole("link", { name: products[3].name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/products/${products[3].slug}$`));
});

test("featured products do not roll with reduced motion", async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto("/");
  const carousel = page.getByRole("group", { name: "Featured products" });
  await expect(carousel.getByRole("button", { name: "Next product" })).toBeVisible();
  await expect(carousel.getByRole("button", { name: /Pause|Play/ })).toHaveCount(0);
  await page.waitForTimeout(6000);
  await expect(carousel.getByRole("button", { name: "Show product 1", exact: true })).toHaveAttribute("aria-current", "true");
  await page.close();
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

test("the only Discuss a project link in the page body is the hero button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("link", { name: "Discuss a project" })).toHaveCount(1);
});

test("hero buttons open the products and contact pages", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("main").locator("section").first();
  // Discuss a project is the gold primary, first; Explore products the outlined secondary.
  await expect(hero.getByRole("link")).toHaveText(["Discuss a project", "Explore products"]);
  await expect(hero.getByRole("link", { name: "Discuss a project" })).toHaveAttribute("href", "/contact");
  await hero.getByRole("link", { name: "Explore products" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("page heroes end with one call to action, none on Contact and Privacy", async ({ page }) => {
  const ctas: [string, string | null][] = [
    ["/about", "Discuss a project"],
    ["/services", "Discuss a project"],
    ["/clients", "Discuss a project"],
    ["/success-stories", "Discuss a project"],
    ["/products", "Product inquiry"],
    ["/contact", null],
    ["/privacy", null],
  ];
  for (const [path, name] of ctas) {
    await page.goto(path);
    const band = page.locator("section.header-band").first();
    const cta = band.getByRole("link", { name: /^(Discuss a project|Product inquiry)$/ });
    if (name === null) {
      await expect(cta, path).toHaveCount(0);
      continue;
    }
    await expect(cta, path).toHaveText(name);
    await expect(cta, path).toHaveAttribute("href", "/contact");
    // Below the intro, not beside it.
    const intro = await band.locator("h1 + p").boundingBox();
    const button = await cta.boundingBox();
    expect(button!.y, path).toBeGreaterThan(intro!.y + intro!.height);
  }
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
