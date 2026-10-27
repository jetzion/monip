import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "report";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const RUN = randomBytes(3).toString("hex");
const ALPHA = { firstName: "E2E", lastName: `Alpha ${RUN}` };
const BETA = { firstName: "E2E", lastName: `Beta ${RUN}` };
const ALPHA_NAME = `E2E Alpha ${RUN}`;
const BETA_NAME = `E2E Beta ${RUN}`;
const REPORT = "/admin/training-report";
const PDF = "/api/training-sessions/report";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

const token = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return ((await response.json()) as { token: string }).token;
};

const auth = async (request: APIRequestContext) => ({ Authorization: `JWT ${await token(request, ADMIN)}` });

let alphaId: number;
let betaId: number;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const headers = await auth(request);
  const trainer = async (data: object) =>
    ((await (await request.post("/api/trainers", { headers, data })).json()) as { doc: { id: number } }).doc.id;
  alphaId = await trainer(ALPHA);
  betaId = await trainer(BETA);
  const found = await request.get("/api/cruise-sailings?limit=1&depth=0", { headers });
  const cruise = ((await found.json()) as { docs: { id: number }[] }).docs[0].id;
  // Online sessions in March and May 2027: Alpha 2 h + 4 h in March, Beta 8 h in March, Alpha 2 h in May.
  const online = (trainer: number, date: string, durationHours: string) =>
    request.post("/api/training-sessions", {
      headers,
      data: { cruise, trainer, type: "online", date, startTime: "09:00", timeZone: "America/New_York", durationHours },
    });
  for (const response of await Promise.all([
    online(alphaId, "2027-03-10", "2"),
    online(alphaId, "2027-03-02", "4"),
    online(betaId, "2027-03-05", "8"),
    online(alphaId, "2027-05-04", "2"),
  ])) {
    expect(response.status()).toBe(201);
  }
});

test.afterAll(async ({ request }) => {
  const headers = await auth(request);
  for (const id of [alphaId, betaId]) {
    await request.delete(`/api/training-sessions?where[trainer][equals]=${id}`, { headers });
    await request.delete(`/api/trainers/${id}`, { headers });
  }
  users("delete");
});

const logIn = async (page: Page, email = ADMIN) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
};

test("the PDF requires an admin and valid months", async ({ request }) => {
  expect((await request.get(PDF)).status()).toBe(401);
  const editor = { Authorization: `JWT ${await token(request, EDITOR)}` };
  expect((await request.get(PDF, { headers: editor })).status()).toBe(403);
  const refused = await request.get(`${PDF}?from=2027-05&to=2027-03`, { headers: await auth(request) });
  expect(refused.status()).toBe(400);
  expect(await refused.json()).toEqual({ error: "The end month must be the same as or after the start month." });
});

test("editors cannot see the report page", async ({ page }) => {
  await logIn(page, EDITOR);
  await page.goto(REPORT);
  await expect(page.getByText("Only admins can see the training report.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("the Training Schedule links to the report", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/collections/training-sessions");
  await page.getByRole("link", { name: "Training report" }).click();
  await expect(page.getByRole("heading", { name: "Training report", level: 1 })).toBeVisible();
});

test("one trainer over a month, then listed by date", async ({ page }) => {
  await logIn(page);
  await page.goto(`${REPORT}?trainer=${alphaId}&from=2027-03&to=2027-03`);
  await expect(page.getByRole("heading", { name: `Training report: ${ALPHA_NAME}` })).toBeVisible();
  await expect(page.locator(".training-report__heading p")).toHaveText("March 2027");
  const rows = page.locator(".training-report__table tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("2 Mar 2027");
  await expect(rows.nth(0)).toContainText("09:00 – 13:00");
  await expect(rows.nth(1)).toContainText("10 Mar 2027");
  await expect(page.getByText("2 sessions · 6 hours", { exact: true })).toBeVisible();

  const layout = page.locator("#training-report-group");
  await layout.click();
  await page.locator(".rs__option").filter({ hasText: "List by date" }).click();
  await expect(page).toHaveURL(/group=date/);
  await expect(page.getByRole("columnheader", { name: "Trainer" })).toBeVisible();
  await expect(rows).toHaveCount(2);
});

test("all trainers over several months, grouped by trainer", async ({ page }) => {
  await logIn(page);
  await page.goto(`${REPORT}?from=2027-03&to=2027-05`);
  await expect(page.getByRole("heading", { name: "Training report: all trainers" })).toBeVisible();
  await expect(page.locator(".training-report__heading p")).toHaveText("March 2027 – May 2027");
  const headings = page.locator(".training-report__group h3");
  const names = await headings.allInnerTexts();
  expect(names.indexOf(ALPHA_NAME)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(ALPHA_NAME)).toBeLessThan(names.indexOf(BETA_NAME));
  const alpha = page.locator(".training-report__group").filter({ has: page.getByRole("heading", { name: ALPHA_NAME }) });
  await expect(alpha.locator("tbody tr")).toHaveCount(3);
  await expect(alpha.getByText("3 sessions · 8 hours")).toBeVisible();
  await expect(alpha.getByRole("columnheader", { name: "Trainer" })).toHaveCount(0);
});

test("an end month before the start month shows an error and no download", async ({ page }) => {
  await logIn(page);
  await page.goto(`${REPORT}?from=2027-05&to=2027-03`);
  await expect(page.locator(".training-report__error")).toHaveText("The end month must be the same as or after the start month.");
  await expect(page.getByRole("link", { name: "Download PDF" })).toHaveCount(0);
});

test("Download PDF saves the report", async ({ page }) => {
  await logIn(page);
  await page.goto(`${REPORT}?trainer=${betaId}&from=2027-03&to=2027-04`);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download PDF" }).click()]);
  expect(download.suggestedFilename()).toBe("training-report-2027-03-to-2027-04.pdf");
  const bytes = readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
});
