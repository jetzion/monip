import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { AVATAR_COLORS } from "../../lib/admin/initials";

/** "#1d4ed8" as the browser reports it: "rgb(29, 78, 216)". */
const hexToRgb = (hex: string) => `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(", ")})`;

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "account";
const TRAINER = `e2e-${USER_SET}-trainer@example.com`;
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

/** The id of the first port in Port time zones, read as the logged-in user. */
const firstPortId = async (page: Page) =>
  ((await (await page.request.get("/api/port-time-zones?limit=1&depth=0")).json()) as { docs: { id: number }[] }).docs[0].id;

test.beforeAll(() => {
  users("create", PASSWORD);
});

test.afterAll(() => {
  users("delete");
});

test("the avatar opens a menu with Account and Log out, and logging out ends the session", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(TRAINER);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");

  // Payload's avatar link is replaced by the avatar with a menu.
  await expect(page.locator(".app-header__account")).toBeHidden();
  // The user's initials in a circle of their colour; no picture is loaded from Gravatar.
  const initials = page.locator(".account-menu__initials");
  await expect(initials).toHaveText("ET");
  expect(AVATAR_COLORS.map(hexToRgb)).toContain(await initials.evaluate((element) => getComputedStyle(element).backgroundColor));
  await expect(page.locator("img[src*='gravatar.com']")).toHaveCount(0);
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByText(TRAINER, { exact: true })).toBeVisible();
  await expect(page.locator(".popup-button-list__button", { hasText: "Account" })).toHaveAttribute("href", "/admin/account");

  // Trainers do not see Users in the navigation, but their own account page still opens.
  await page.locator(".popup-button-list__button", { hasText: "Account" }).click();
  await page.waitForURL("**/admin/account");
  await expect(page.getByLabel("Email")).toHaveValue(TRAINER);
  // A record page (here a port) shows trainers no Edit or API tabs.
  await page.goto(`/admin/collections/port-time-zones/${await firstPortId(page)}`);
  await expect(page.getByLabel("Start port")).toBeVisible();
  await expect(page.locator(".doc-tab")).toHaveCount(0);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Account menu" }).click();

  await page.locator(".popup-button-list__button", { hasText: "Log out" }).click();
  await page.waitForURL("**/admin/login**");
  // The session is gone: the admin asks to log in again.
  await page.goto("/admin/collections/training-sessions");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admins keep the Edit and API tabs on record pages", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
  await page.goto(`/admin/collections/port-time-zones/${await firstPortId(page)}`);
  await expect(page.locator(".doc-tab", { hasText: "API" })).toBeVisible();
  await expect(page.locator(".doc-tab", { hasText: "Edit" })).toBeVisible();
});

test("users have First name and Last name; the full name follows them", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/collections/users");
  await expect(page.getByRole("columnheader", { name: "First name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Last name" })).toBeVisible();

  const me = ((await (await page.request.get("/api/users/me")).json()) as { user: { id: number } }).user;
  await page.goto(`/admin/collections/users/${me.id}`);
  await expect(page.getByLabel("First name")).toHaveValue("E2E");
  await expect(page.getByLabel("Last name")).toHaveValue("admin");
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);

  const saved = await page.request.patch(`/api/users/${me.id}`, { data: { firstName: "Ada", lastName: "Lovelace" } });
  expect(((await saved.json()) as { doc: { name: string } }).doc.name).toBe("Ada Lovelace");
  const cleared = await page.request.patch(`/api/users/${me.id}`, { data: { firstName: "", lastName: "" } });
  expect(((await cleared.json()) as { doc: { name: string | null } }).doc.name).toBeNull();
});
