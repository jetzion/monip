import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "planner";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const RUN = randomBytes(3).toString("hex");
const COSTS = "/api/globals/training-costs";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

const auth = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return { Authorization: `JWT ${((await response.json()) as { token: string }).token}` };
};

type Costs = Record<"onlineSession" | "departureDaySession" | "onboardingDay" | "trip" | "night", number | null>;

let admin: Record<string, string>;
let trainerId: number | undefined;
let originalCosts: Costs;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  admin = await auth(request, ADMIN);
  originalCosts = (await (await request.get(COSTS, { headers: admin })).json()) as Costs;
});

test.afterAll(async ({ request }) => {
  if (trainerId) await request.delete(`/api/trainers/${trainerId}`, { headers: admin });
  // Empty values come back missing, so restore each one explicitly.
  const fields = ["onlineSession", "departureDaySession", "onboardingDay", "trip", "night"] as const;
  const data = Object.fromEntries(fields.map((field) => [field, originalCosts[field] ?? null]));
  await request.post(COSTS, { headers: admin, data });
  users("delete");
});

test("trainers store a home base, cruise availability, and a monthly limit", async ({ request }) => {
  const port = ((await (await request.get("/api/port-time-zones?limit=1&depth=0", { headers: admin })).json()) as {
    docs: { id: number }[];
  }).docs[0];

  const created = await request.post("/api/trainers", {
    headers: admin,
    data: { firstName: "E2E", lastName: `Planner ${RUN}` },
  });
  expect(created.ok()).toBe(true);
  const doc = ((await created.json()) as { doc: { id: number; canJoinCruises: boolean } }).doc;
  trainerId = doc.id;
  expect(doc.canJoinCruises).toBe(true);

  const updated = await request.patch(`/api/trainers/${trainerId}?depth=0`, {
    headers: admin,
    data: { homeBase: port.id, canJoinCruises: false, maxDaysPerMonth: 12 },
  });
  expect(updated.ok()).toBe(true);
  expect((await updated.json()).doc).toMatchObject({ homeBase: port.id, canJoinCruises: false, maxDaysPerMonth: 12 });

  const invalid = await request.patch(`/api/trainers/${trainerId}`, { headers: admin, data: { maxDaysPerMonth: 40 } });
  expect(invalid.status()).toBe(400);
});

test("planning costs are optional and admin only", async ({ request }) => {
  const saved = await request.post(COSTS, { headers: admin, data: { onlineSession: 150, trip: null } });
  expect(saved.ok()).toBe(true);
  expect((await saved.json()).result).toMatchObject({ onlineSession: 150, trip: null });

  const editor = await auth(request, EDITOR);
  expect((await request.get(COSTS, { headers: editor })).status()).toBe(403);
  expect((await request.post(COSTS, { headers: editor, data: { onlineSession: 1 } })).status()).toBe(403);
  expect((await request.get(COSTS)).status()).toBe(403);
});

test("the admin sees the new fields", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/admin$/);

  await page.goto(`/admin/collections/trainers/${trainerId}`);
  await expect(page.getByText("Home base", { exact: true })).toBeVisible();
  await expect(page.getByText("Can join cruises", { exact: true })).toBeVisible();
  await expect(page.getByText("Maximum training days per month", { exact: true })).toBeVisible();

  await page.goto("/admin/globals/training-costs");
  await expect(page.getByRole("heading", { name: "Training planning costs" })).toBeVisible();

  await page.goto("/admin/collections/training-sessions/create");
  await expect(page.getByText("Fixed", { exact: true })).toBeVisible();
});
