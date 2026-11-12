import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "headers";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

let headers: Record<string, string>;
let created: number | undefined;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
  const existing = await request.get("/api/pages?where[key][equals]=services&depth=0", { headers });
  test.skip(((await existing.json()) as { totalDocs: number }).totalDocs > 0, "A Services page entry already exists.");
});

test.afterAll(async ({ request }) => {
  if (created) await request.delete(`/api/pages/${created}`, { headers });
  users("delete");
});

test("Services banner falls back to its default title without a Pages entry", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Services");
});

test("Services banner shows the title, headline, and intro from Pages", async ({ page, request }) => {
  const response = await request.post("/api/pages", {
    headers,
    data: {
      _status: "published",
      key: "services",
      title: "e2e Services label",
      headline: "e2e Services headline",
      intro: "e2e Services intro",
    },
  });
  expect(response.ok()).toBe(true);
  created = ((await response.json()) as { doc: { id: number } }).doc.id;

  await page.goto("/services");
  const banner = page.locator("section.header-band");
  await expect(banner.getByRole("heading", { level: 1 })).toHaveText("e2e Services headline");
  await expect(banner.getByText("e2e Services label", { exact: true })).toBeVisible();
  await expect(banner.getByText("e2e Services intro", { exact: true })).toBeVisible();
});
