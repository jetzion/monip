import { expect, test } from "@playwright/test";

/** Requires the Success Stories page and at least one published story (pnpm seed creates placeholders). */
test("Success Stories page is linked from the header and cards open their detail page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Success Stories", exact: true }).click();
  await expect(page).toHaveURL(/\/success-stories$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const cards = page.getByRole("list", { name: "Success stories" }).getByRole("listitem");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const image of await cards.getByRole("img").all()) {
    await expect(image).toHaveAttribute("alt", /\S/);
  }

  const title = await cards.first().getByRole("heading", { level: 2 }).innerText();
  await cards.first().getByRole("link", { name: title }).click();
  await expect(page).toHaveURL(/\/success-stories\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await breadcrumb.getByRole("link", { name: "Success Stories" }).click();
  await expect(page).toHaveURL(/\/success-stories$/);
});

test("unknown story returns 404", async ({ page }) => {
  expect((await page.request.get("/success-stories/no-such-story")).status()).toBe(404);
});

test("sitemap lists the Success Stories page and its stories", async ({ page }) => {
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(/\/success-stories<\/loc>/);
  expect(sitemap).toMatch(/\/success-stories\/[a-z0-9-]+<\/loc>/);
});
