import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "role";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const TRAINER = `e2e-${USER_SET}-trainer@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const RUN = randomBytes(3).toString("hex");

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

type Session = { id: number; canceled?: boolean; startTime?: string };

let admin: Record<string, string>;
let trainer: Record<string, string>;
let trainerId: number;
let cruiseId: number;

/** An online session on the given day (Rome time, 09:00 unless given). */
const online = (date: string, startTime = "09:00") => ({
  cruise: cruiseId,
  trainer: trainerId,
  type: "online",
  date: `${date}T12:00:00.000Z`,
  startTime,
  timeZone: "Europe/Rome",
  durationHours: "2",
});

const create = async (request: APIRequestContext, headers: Record<string, string>, data: object) => {
  const response = await request.post("/api/training-sessions", { headers, data });
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { doc: Session }).doc;
};

const patch = (request: APIRequestContext, id: number, data: object) =>
  request.patch(`/api/training-sessions/${id}`, { headers: trainer, data });

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  admin = await auth(request, ADMIN);
  trainer = await auth(request, TRAINER);
  const created = await request.post("/api/trainers", { headers: admin, data: { firstName: "E2E", lastName: `Role ${RUN}` } });
  trainerId = ((await created.json()) as { doc: { id: number } }).doc.id;
  const sailings = await request.get("/api/cruise-sailings?limit=1&depth=0", { headers: admin });
  cruiseId = ((await sailings.json()) as { docs: { id: number }[] }).docs[0].id;
});

test.afterAll(async ({ request }) => {
  await request.delete(`/api/training-sessions?where[trainer][equals]=${trainerId}`, { headers: admin });
  await request.delete(`/api/trainers/${trainerId}`, { headers: admin });
  users("delete");
});

test("trainers get the Training Schedule tools and no website content", async ({ request }) => {
  for (const path of [
    "/api/training-sessions",
    "/api/cruise-sailings?limit=1",
    "/api/trainers",
    "/api/port-time-zones?limit=1",
    "/api/globals/training-costs",
    "/api/globals/training-preferences",
    "/api/globals/training-plan",
  ]) {
    expect((await request.get(path, { headers: trainer })).status(), path).toBe(200);
  }

  // View only: no editing sailings, trainers, or port time zones.
  expect((await request.patch(`/api/cruise-sailings/${cruiseId}`, { headers: trainer, data: { nights: 1 } })).status()).toBe(403);
  expect((await request.get("/api/cruise-sailings/template", { headers: trainer })).status()).toBe(403);
  expect((await request.post("/api/cruise-sailings/import", { headers: trainer })).status()).toBe(403);
  expect((await request.post("/api/trainers", { headers: trainer, data: { firstName: "No", lastName: "Access" } })).status()).toBe(403);
  expect((await request.post("/api/port-time-zones", { headers: trainer, data: { port: "No access", timeZone: "UTC" } })).status()).toBe(403);

  // No website content.
  expect((await request.post("/api/products", { headers: trainer, data: { name: "No access" } })).status()).toBe(403);
  expect((await request.post("/api/pages", { headers: trainer, data: { title: "No access" } })).status()).toBe(403);
  expect((await request.post("/api/products/describe", { headers: trainer, data: {} })).status()).toBe(403);
  expect((await request.get("/api/inquiries", { headers: trainer })).status()).toBe(403);
  expect((await request.get("/preview?path=/", { headers: trainer, maxRedirects: 0 })).status()).toBe(403);
  const self = (await (await request.get("/api/users", { headers: trainer })).json()) as { totalDocs: number };
  expect(self.totalDocs).toBe(1);

  // Editors still have no training access.
  const editor = await auth(request, EDITOR);
  expect((await request.get("/api/training-sessions", { headers: editor })).status()).toBe(403);
});

test("the admin menu shows trainers the training tools, not website content", async ({ page, browser }) => {
  // Controls: the same links and button are there for an editor and an admin.
  const other = await browser.newPage();
  await login(other, EDITOR);
  await expect(other.locator("nav").getByRole("link", { name: "Products" })).toBeVisible();
  await other.context().clearCookies();
  await login(other, ADMIN);
  await expect(other.locator("nav").getByRole("link", { name: "Users" })).toBeVisible();
  await expect(other.locator("nav").getByRole("link", { name: "Training planning costs" })).toBeVisible();
  // Admins keep Collections (website content and users) next to the Training group.
  await expect(other.locator("nav").getByText("Collections", { exact: true })).toBeVisible();
  await expect(other.locator("nav").getByText("Training", { exact: true })).toBeVisible();
  await other.goto("/admin/collections/cruise-sailings");
  await expect(other.getByRole("button", { name: "Import Excel" })).toBeVisible();
  await other.close();

  await login(page, TRAINER);
  const nav = page.locator("nav");
  await expect(nav.getByRole("link", { name: "Training Schedule" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Cruise Fleet Schedule" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Products" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Media" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Training planning costs" })).toHaveCount(0);
  // Trainers see one group, Training.
  await expect(nav.getByText("Training", { exact: true })).toBeVisible();
  await expect(nav.getByText("Collections", { exact: true })).toHaveCount(0);

  await page.goto("/admin/collections/cruise-sailings");
  await expect(page.getByRole("button", { name: "Import Excel" })).toHaveCount(0);
  await page.goto("/admin/training-planner");
  await expect(page.getByRole("heading", { name: "Training planner" })).toBeVisible();
});

test("trainers change sessions until they start, then can only cancel or restore them", async ({ request }) => {
  const future = await create(request, trainer, online("2030-02-04"));
  expect((await patch(request, future.id, { startTime: "10:00" })).ok()).toBe(true);
  expect((await request.delete(`/api/training-sessions/${future.id}`, { headers: trainer })).ok()).toBe(true);

  const started = await create(request, admin, online("2025-02-04"));
  const edit = await patch(request, started.id, { startTime: "10:00" });
  expect(edit.status()).toBe(403);
  expect(await edit.text()).toContain("This session has started. You can only cancel it or restore it.");
  expect((await request.delete(`/api/training-sessions/${started.id}`, { headers: trainer })).ok()).toBe(false);

  const canceled = await patch(request, started.id, { canceled: true });
  expect(canceled.ok(), await canceled.text()).toBe(true);
  expect(((await canceled.json()) as { doc: Session }).doc).toMatchObject({ canceled: true, startTime: "09:00" });
  expect((await patch(request, started.id, { canceled: false })).ok()).toBe(true);

  // Admins can still edit and delete it.
  expect((await request.patch(`/api/training-sessions/${started.id}`, { headers: admin, data: { startTime: "11:00" } })).ok()).toBe(true);
  expect((await request.delete(`/api/training-sessions/${started.id}`, { headers: admin })).ok()).toBe(true);
});

test("a canceled session frees the trainer until it is restored", async ({ request }) => {
  const first = await create(request, trainer, online("2030-03-05"));
  const clash = await request.post("/api/training-sessions", { headers: trainer, data: online("2030-03-05", "10:00") });
  expect(clash.status()).toBe(400);

  expect((await patch(request, first.id, { canceled: true })).ok()).toBe(true);
  const second = await create(request, trainer, online("2030-03-05", "10:00"));
  expect(second.id).toBeGreaterThan(0);

  const restore = await patch(request, first.id, { canceled: false });
  expect(restore.status()).toBe(400);
  expect(await restore.text()).toContain("This trainer is already booked");
});

test("the calendar greys out canceled sessions; trainers cancel started sessions there", async ({ page, request }) => {
  const started = await create(request, admin, online("2025-04-08"));
  await login(page, TRAINER);
  await page.goto(`/admin/collections/training-sessions?calMonth=2025-04&calTrainer=${trainerId}&calSession=${started.id}`);
  const details = page.getByRole("region", { name: "Session details" });
  await expect(details.getByText("Scheduled")).toBeVisible();
  await expect(details.getByRole("link", { name: "Edit" })).toHaveCount(0);
  await expect(details.getByRole("button", { name: "Delete" })).toHaveCount(0);

  page.once("dialog", (dialog) => void dialog.accept());
  await details.getByRole("button", { name: "Cancel session" }).click();
  await expect(details.getByRole("button", { name: "Restore session" })).toBeVisible();
  await expect(details.getByText(/^Canceled/)).toBeVisible();
  const entry = page.locator(`.training-calendar__entry--canceled[aria-label*="Role ${RUN}"]`).first();
  await expect(entry).toContainText("Canceled");

  await details.getByRole("button", { name: "Restore session" }).click();
  await expect(details.getByRole("button", { name: "Cancel session" })).toBeVisible();
  await expect(page.locator(`.training-calendar__entry--canceled[aria-label*="Role ${RUN}"]`)).toHaveCount(0);
});

test("trainers change travel rates, but not a port's name or time zone", async ({ request }) => {
  type Zone = { id: number; port: string; timeZone: string; flightFare?: number | null; hotelPerNight?: number | null };
  const zone = ((await (await request.get("/api/port-time-zones?limit=1", { headers: trainer })).json()) as { docs: Zone[] }).docs[0];
  const costs = (await (await request.get("/api/globals/training-costs", { headers: trainer })).json()) as { carRentalPerDay?: number | null };
  try {
    const saved = await request.patch(`/api/port-time-zones/${zone.id}`, {
      headers: trainer,
      data: { port: "Renamed", timeZone: "UTC", flightFare: 812, hotelPerNight: 190 },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    // Field access drops the admin-only fields and keeps the rates.
    expect(((await saved.json()) as { doc: Zone }).doc).toMatchObject({
      port: zone.port,
      timeZone: zone.timeZone,
      flightFare: 812,
      hotelPerNight: 190,
    });

    const rate = await request.post("/api/globals/training-costs", { headers: trainer, data: { carRentalPerDay: 75 } });
    expect(rate.ok(), await rate.text()).toBe(true);
    expect(((await rate.json()) as { result: { carRentalPerDay: number } }).result.carRentalPerDay).toBe(75);
  } finally {
    await request.patch(`/api/port-time-zones/${zone.id}`, {
      headers: admin,
      data: { flightFare: zone.flightFare ?? null, hotelPerNight: zone.hotelPerNight ?? null },
    });
    await request.post("/api/globals/training-costs", { headers: admin, data: { carRentalPerDay: costs.carRentalPerDay ?? null } });
  }
});

test("only admins and trainers can look up travel prices", async ({ request, playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL });
  expect((await anonymous.post("/api/training-sessions/estimate", { data: {} })).status()).toBe(401);
  await anonymous.dispose();
  const editor = await auth(request, EDITOR);
  expect((await request.post("/api/training-sessions/estimate", { headers: editor, data: {} })).status()).toBe(403);
  // A trainer is let in; an incomplete request is refused before anything is looked up.
  const missing = await request.post("/api/training-sessions/estimate", { headers: trainer, data: { port: "Miami, Florida" } });
  expect([400, 503]).toContain(missing.status());
});
