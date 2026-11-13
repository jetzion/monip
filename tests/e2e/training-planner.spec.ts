import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "plan";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const RUN = randomBytes(3).toString("hex");
const SHIPS = [`E2E Planner Alpha ${RUN}`, `E2E Planner Beta ${RUN}`];
const PLAN = "/api/globals/training-plan";
// No real sailings this far ahead, so the plan holds only the test ships.
const SETTINGS = { from: "2030-03-01", to: "2030-03-31", preset: "balanced" };

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

const auth = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return { Authorization: `JWT ${((await response.json()) as { token: string }).token}` };
};

let admin: Record<string, string>;
const trainerIds: number[] = [];
const sailingIds: number[] = [];

const sessionsOf = async (request: APIRequestContext) => {
  const response = await request.get(`/api/training-sessions?depth=0&limit=50&where[trainer][in]=${trainerIds.join(",")}`, { headers: admin });
  return ((await response.json()) as { docs: { id: number; cruise: number; startsAt: string }[] }).docs;
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  admin = await auth(request, ADMIN);
  const port = ((await (await request.get("/api/port-time-zones?depth=0&where[port][equals]=Miami, Florida", { headers: admin })).json()) as {
    docs: { id: number }[];
  }).docs[0];
  // Two trainers based in Miami, so they beat any real trainer who would have to travel.
  for (const name of ["One", "Two"]) {
    const created = await request.post("/api/trainers", {
      headers: admin,
      data: { firstName: "E2E", lastName: `Planner ${name} ${RUN}`, homeBase: port.id },
    });
    trainerIds.push(((await created.json()) as { doc: { id: number } }).doc.id);
  }
  // Both ships sail from Miami on 10 March; Alpha sails again on 17 March.
  for (const [ship, day] of [[SHIPS[0], "10"], [SHIPS[1], "10"], [SHIPS[0], "17"]]) {
    const created = await request.post("/api/cruise-sailings", {
      headers: admin,
      data: {
        cruiseLine: "E2E Line",
        ship,
        startDate: `2030-03-${day}T12:00:00.000Z`,
        endDate: `2030-03-${Number(day) + 4}T12:00:00.000Z`,
        startPort: "Miami, Florida",
        endPort: "Miami, Florida",
        arrival: "07:00",
        departure: "16:00",
      },
    });
    sailingIds.push(((await created.json()) as { doc: { id: number } }).doc.id);
  }
});

test.afterAll(async ({ request }) => {
  for (const session of await sessionsOf(request)) await request.delete(`/api/training-sessions/${session.id}`, { headers: admin });
  for (const id of sailingIds) await request.delete(`/api/cruise-sailings/${id}`, { headers: admin });
  for (const id of trainerIds) await request.delete(`/api/trainers/${id}`, { headers: admin });
  await request.post(PLAN, { headers: admin, data: { current: null } });
  users("delete");
});

// The page's AI calls are mocked so no OpenRouter request is made (the API tests below never reach the AI).
test.beforeEach(async ({ page }) => {
  await page.route("**/api/globals/training-plan/summarize", (route) => route.fulfill({ json: { summary: "Mock summary" } }));
  await page.route("**/api/globals/training-plan/interpret", (route) => route.fulfill({ status: 503, json: { error: "Not mocked." } }));
});

const login = async (page: Page, email: string) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
};

test("only admins can plan or accept", async ({ page, request, playwright, baseURL }) => {
  const editor = await auth(request, EDITOR);
  expect((await request.post(`${PLAN}/recommend`, { headers: editor, data: SETTINGS })).status()).toBe(403);
  expect((await request.post(`${PLAN}/accept`, { headers: editor, data: { proposals: [0], moves: [] } })).status()).toBe(403);
  // A fresh context: `request` keeps the cookie from the logins above.
  const anonymous = await playwright.request.newContext({ baseURL });
  expect((await anonymous.post(`${PLAN}/recommend`, { data: SETTINGS })).status()).toBe(401);
  await anonymous.dispose();
  expect((await request.get(PLAN, { headers: editor })).status()).toBe(403);
  await login(page, EDITOR);
  await page.goto("/admin/training-planner");
  await expect(page.getByText("Only admins can use the training planner.")).toBeVisible();
});

test("explains invalid settings", async ({ request }) => {
  const response = await request.post(`${PLAN}/recommend`, { headers: admin, data: { ...SETTINGS, to: "2030-07-31" } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Choose at most 92 days (about three months)." });
});

test("recommends a plan, accepts part of it, and replaces it on request", async ({ page, request }) => {
  expect((await request.post(`${PLAN}/recommend`, { headers: admin, data: SETTINGS })).ok()).toBe(true);
  await login(page, ADMIN);
  await page.goto("/admin/collections/training-sessions");
  await page.getByRole("link", { name: "Training planner" }).click();

  await expect(page.getByRole("heading", { name: "Balanced plan for cruises starting 1 Mar 2030 – 31 Mar 2030" })).toBeVisible();
  await expect(page.getByText("2 of 2 plannable ships planned: 2 departure day, 0 onboarding, 0 online.")).toBeVisible();
  const sessions = page.getByRole("region", { name: "Proposed sessions" });
  // Same day, same port: one ship per trainer.
  await expect(sessions.getByRole("row", { name: new RegExp(SHIPS[0]) })).toContainText("Departure day training, 10 Mar 2030, 07:00 – 16:00");
  await expect(sessions.getByRole("row", { name: new RegExp(SHIPS[1]) })).toContainText("home base; not trained before.");

  await sessions.getByRole("checkbox", { name: `Accept session for ${SHIPS[0]} (E2E Line)` }).check();
  await page.getByRole("button", { name: "Accept selected (1)" }).click();
  await expect(sessions.getByRole("row", { name: new RegExp(SHIPS[0]) })).toContainText("Accepted");
  await expect(sessions.getByRole("checkbox", { name: `Accept session for ${SHIPS[0]} (E2E Line)` })).toBeDisabled();
  const saved = await sessionsOf(request);
  expect(saved).toHaveLength(1);
  expect(saved[0].cruise).toBe(sailingIds[0]);

  // A new plan replaces this one; Alpha is now trained, so only Beta is proposed.
  await page.getByRole("button", { name: "Suggest a new plan" }).click();
  await expect(page.getByText("1 of 2 plannable ships planned: 1 departure day, 0 onboarding, 0 online.")).toBeVisible();
  await expect(sessions.getByRole("row", { name: new RegExp(SHIPS[1]) })).toBeVisible();
  await expect(sessions.getByRole("row", { name: new RegExp(SHIPS[0]) })).toHaveCount(0);
});

test("edits a proposal before accepting it", async ({ page, request }) => {
  const editor = await auth(request, EDITOR);
  const body = { index: 0, cruise: sailingIds[1], trainer: trainerIds[1], type: "departureDay", save: false };
  expect((await request.post(`${PLAN}/edit`, { headers: editor, data: body })).status()).toBe(403);

  await login(page, ADMIN);
  await page.goto("/admin/training-planner");
  const sessions = page.getByRole("region", { name: "Proposed sessions" });
  const beta = sessions.getByRole("row", { name: new RegExp(SHIPS[1]) }).first();
  const trainerOf = (await beta.innerText()).includes(`Planner One ${RUN}`) ? "One" : "Two";
  const other = trainerOf === "One" ? "Two" : "One";
  await sessions.getByRole("button", { name: `Edit session for ${SHIPS[1]} (E2E Line)` }).click();
  const form = page.getByRole("group", { name: `Change the session for ${SHIPS[1]} (E2E Line)` });
  const choose = async (label: string, option: string) => {
    await form.getByLabel(label, { exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };

  // The other trainer already has Alpha's accepted session on the 10th.
  await choose("Trainer", `E2E Planner ${other} ${RUN}`);
  await expect(form.getByRole("alert")).toContainText(`already has training then: ${SHIPS[0]}`);
  await expect(form.getByRole("button", { name: "Save change" })).toBeDisabled();

  // Online after the ship leaves is allowed, with a warning.
  await choose("Trainer", `E2E Planner ${trainerOf} ${RUN}`);
  await choose("Training type", "Online training");
  await form.getByLabel("Start time (port time)").fill("17:00");
  await expect(form.getByText("Outside the ship's time in port (07:00–16:00).")).toBeVisible();
  await expect(form.getByText("Will be: Online training, 10 Mar 2030, 17:00 – 19:00 (America/New_York).", { exact: false })).toBeVisible();
  await form.getByRole("button", { name: "Save anyway" }).click();

  await expect(beta).toContainText("Online training, 10 Mar 2030, 17:00 – 19:00");
  await expect(beta).toContainText("edited by an admin");
  await expect(page.getByText("1 of 2 plannable ships planned: 0 departure day, 0 onboarding, 1 online.")).toBeVisible();
});

test("asks the AI for a plan from an instruction and shows what it applied", async ({ page, request }) => {
  const editor = await auth(request, EDITOR);
  for (const path of ["interpret", "summarize"]) {
    expect((await request.post(`${PLAN}/${path}`, { headers: editor, data: { instruction: "x" } })).status()).toBe(403);
  }
  expect((await request.post(`${PLAN}/interpret`, { headers: admin, data: { instruction: " " } })).status()).toBe(400);

  await login(page, ADMIN);
  // The AI keeps Trainer One away on 10 March and cannot book flights.
  await page.route("**/api/globals/training-plan/interpret", async (route) => {
    const { instruction, settings } = route.request().postDataJSON() as { instruction: string; settings: Record<string, unknown> };
    expect(instruction).toBe("Trainer One is away on 10 March. Book their flights.");
    await route.fulfill({
      json: {
        understood: "Trainer One is unavailable on 10 March.",
        notApplied: ["Booking flights is not part of planning."],
        settings: { ...settings, ...SETTINGS, rules: { unavailable: [{ trainerId: trainerIds[0], from: "2030-03-10", to: "2030-03-10" }], blockedTypes: [], trainerPorts: [], excludeShips: [] } },
      },
    });
  });
  await page.goto("/admin/training-planner");
  await page.getByLabel("Instruction for the AI (optional)").fill("Trainer One is away on 10 March. Book their flights.");
  await page.getByRole("button", { name: "Ask AI for a plan" }).click();

  await expect(page.getByText("The AI applied: Trainer One is unavailable on 10 March.")).toBeVisible();
  await expect(page.getByText("Booking flights is not part of planning.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Rules" })).toContainText(`E2E Planner One ${RUN} unavailable on 10 Mar 2030`);
  // Beta needs a trainer on the 10th; only Trainer Two may take it.
  const beta = page.getByRole("region", { name: "Proposed sessions" }).getByRole("row", { name: new RegExp(SHIPS[1]) }).first();
  await expect(beta).toContainText(`E2E Planner Two ${RUN}`);

  // Removing the rule changes the settings for the next plan.
  await page.getByRole("button", { name: `Remove rule: E2E Planner One ${RUN} unavailable on 10 Mar 2030` }).click();
  await expect(page.getByRole("list", { name: "Rules" })).toHaveCount(0);
});

test("shows the stored AI summary", async ({ page, request }) => {
  const { current } = (await (await request.get(PLAN, { headers: admin })).json()) as { current: Record<string, unknown> };
  await request.post(PLAN, { headers: admin, data: { current: { ...current, aiSummary: "One ship is planned in person." } } });
  await login(page, ADMIN);
  await page.goto("/admin/training-planner");
  await expect(page.getByText("AI summary: One ship is planned in person.")).toBeVisible();
});

test("applies an accepted move to the existing session", async ({ request }) => {
  const [session] = await sessionsOf(request);
  const { current } = (await (await request.get(PLAN, { headers: admin })).json()) as { current: Record<string, unknown> };
  const plan = current.plan as { proposals: { fields: Record<string, unknown> }[]; moves: unknown[] };
  // A move of Alpha's session to its 17 March sailing, with Trainer One.
  const to = { ...plan.proposals[0], fields: { cruise: sailingIds[2], trainer: trainerIds[0], type: "departureDay" } };
  const move = { session: { id: session.id }, to, reason: "Test" };
  await request.post(PLAN, { headers: admin, data: { current: { ...current, plan: { ...plan, moves: [move] }, moveStatus: {} } } });

  const accepted = await request.post(`${PLAN}/accept`, { headers: admin, data: { proposals: [], moves: [0] } });
  expect(await accepted.json()).toEqual({ failed: 0 });
  const [moved] = await sessionsOf(request);
  expect(moved.id).toBe(session.id);
  expect(moved.cruise).toBe(sailingIds[2]);
  expect(moved.startsAt.slice(0, 10)).toBe("2030-03-17");
});
