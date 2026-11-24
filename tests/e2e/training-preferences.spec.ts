import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "prefs";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const PREFS = "/api/globals/training-preferences";

type Preferences = { ships?: string[]; ports?: string[] };

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

const auth = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return { Authorization: `JWT ${((await response.json()) as { token: string }).token}` };
};

const login = async (page: Page, email: string) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
};

let admin: Record<string, string>;
let original: Preferences;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  admin = await auth(request, ADMIN);
  original = (await (await request.get(PREFS, { headers: admin })).json()) as Preferences;
});

test.afterAll(async ({ request }) => {
  await request.post(PREFS, { headers: admin, data: { ships: original.ships ?? [], ports: original.ports ?? [] } });
  users("delete");
});

test("editors cannot read or change training preferences", async ({ page, request }) => {
  const editor = await auth(request, EDITOR);
  expect((await request.get(PREFS, { headers: editor })).status()).toBe(403);
  expect((await request.post(PREFS, { headers: editor, data: { ships: [] } })).status()).toBe(403);
  await login(page, EDITOR);
  await page.goto("/admin/training-preferences");
  await expect(page.getByText("Only admins and trainers can use training preferences.")).toBeVisible();
});

test("lists cruise lines, ships, and ports, and saves the ticked ones", async ({ page, request }) => {
  await request.post(PREFS, { headers: admin, data: { ships: [], ports: [] } });
  await login(page, ADMIN);
  await page.goto("/admin/collections/training-sessions");
  await page.getByRole("link", { name: "Training preferences" }).click();
  await expect(page.getByRole("heading", { name: "Training preferences" })).toBeVisible();

  const ships = page.locator("section", { has: page.getByRole("heading", { name: /^Ships/ }) });
  const ports = page.locator("section", { has: page.getByRole("heading", { name: /^Start ports/ }) });
  await expect(ships.locator("legend").first()).toBeVisible();
  const ship = ships.getByRole("checkbox").first();
  const port = ports.getByRole("checkbox").first();
  const shipName = (await ships.locator("label").first().innerText()).trim();
  const portName = (await ports.locator("label").first().innerText()).trim();

  await ship.check();
  await port.check();
  await expect(page.getByRole("heading", { name: "Ships (1 preferred)" })).toBeVisible();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Preferences saved." })).toBeVisible();

  const saved = (await (await request.get(PREFS, { headers: admin })).json()) as Preferences;
  expect(saved.ships).toEqual([shipName]);
  expect(saved.ports).toEqual([portName]);

  await page.reload();
  await expect(ships.getByRole("checkbox").first()).toBeChecked();
  await expect(ports.getByRole("checkbox").first()).toBeChecked();

  await page.goto("/admin/training-planner");
  await expect(page.getByText(`${portName} (their cruises are favoured)`)).toBeVisible();
});

test("Schedule training lists only the preferred ships and ports", async ({ page, request }) => {
  const today = new Date().toISOString().slice(0, 10);
  const found = await request.get(
    `/api/cruise-sailings?limit=1&depth=0&sort=startDate&where[startPort][exists]=true&where[startDate][greater_than_equal]=${today}`,
    { headers: admin },
  );
  const sailing = ((await found.json()) as { docs: { ship: string; startPort: string }[] }).docs[0];
  await request.post(PREFS, { headers: admin, data: { ships: [sailing.ship], ports: [sailing.startPort] } });

  await login(page, ADMIN);
  await page.goto("/admin/collections/training-sessions");
  await expect(page.getByText("Schedule training lists only the preferred ships and ports from")).toBeVisible();
  await page.locator("#training-ship").click();
  await expect(page.locator(".rs__option")).toHaveText([sailing.ship]);
  await page.keyboard.press("Escape");
  await page.locator("#training-port").click();
  await expect(page.locator(".rs__option")).toHaveText([sailing.startPort]);

  await request.post(PREFS, { headers: admin, data: { ships: [sailing.ship], ports: ["No such port"] } });
  await page.reload();
  await expect(page.getByText("No upcoming cruises match the preferred ships and ports.")).toBeVisible();

  // Without preferences, every upcoming cruise is offered again.
  await request.post(PREFS, { headers: admin, data: { ships: [], ports: [] } });
  await page.reload();
  await expect(page.getByText(/preferred ships and ports/)).toHaveCount(0);
  await page.locator("#training-ship").click();
  expect(await page.locator(".rs__option").count()).toBeGreaterThan(1);
});
