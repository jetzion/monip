import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "media";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

test.beforeAll(() => {
  users("create", PASSWORD);
});

test.afterAll(() => {
  users("delete");
});

const login = async (page: Page) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/admin$/);
};

test("the Media list downloads the original file without opening the item", async ({ page }) => {
  await login(page);
  await page.goto("/admin/collections/media");
  const link = page.getByRole("link", { name: "Download", exact: true }).first();
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  const filename = download.suggestedFilename();
  // Byte for byte the uploaded original (local storage keeps it in /media).
  const original = await readFile(`media/${filename}`);
  expect((await readFile(await download.path())).equals(original)).toBe(true);
  await expect(page).toHaveURL(/\/admin\/collections\/media(\?.*)?$/);
});

test("a media item has a Download original button, but not before a file is saved", async ({ page }) => {
  await login(page);
  await page.goto("/admin/collections/media");
  await page.locator("tbody tr").first().locator("td a").first().click();
  await page.waitForURL(/\/admin\/collections\/media\/\d+/);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download original" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.\w+$/);

  await page.goto("/admin/collections/media/create");
  await expect(page.getByLabel("Alt text")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download original" })).toHaveCount(0);
});
