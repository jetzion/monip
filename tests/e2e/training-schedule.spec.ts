import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { cruiseDatesLabel } from "../../lib/training/cruise-choice";

// Its own accounts: the Cruise Fleet Schedule spec may run in a parallel worker.
const USER_SET = "training";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const LIST = "/admin/collections/training-sessions";
// A per-run suffix keeps names unique if a crashed run left trainers behind.
const RUN = randomBytes(3).toString("hex");
const TRAINER = { firstName: "E2E", lastName: `Trainer ${RUN}` };
const SECOND_TRAINER = { firstName: "E2E", lastName: `Second ${RUN}` };
const TRAINER_NAME = `E2E Trainer ${RUN}`;
const SECOND_NAME = `E2E Second ${RUN}`;
const TEST_SHIP = "E2E Test Ship";

type Cruise = { id: number; ship: string; cruiseLine: string; startDate: string; endDate: string; arrival: string; departure: string };

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

let trainerId: number;
let secondTrainerId: number;
let cruise: Cruise;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const headers = await auth(request);
  const created = await request.post("/api/trainers", { headers, data: TRAINER });
  trainerId = ((await created.json()) as { doc: { id: number } }).doc.id;
  const second = await request.post("/api/trainers", { headers, data: SECOND_TRAINER });
  secondTrainerId = ((await second.json()) as { doc: { id: number } }).doc.id;
  const today = new Date().toISOString().slice(0, 10);
  const found = await request.get(
    `/api/cruise-sailings?limit=1&depth=0&sort=startDate&where[startPort][equals]=Miami, Florida&where[arrival][exists]=true&where[departure][exists]=true&where[startDate][greater_than_equal]=${today}`,
    { headers },
  );
  cruise = ((await found.json()) as { docs: Cruise[] }).docs[0];
});

test.afterAll(async ({ request }) => {
  const headers = await auth(request);
  await request.delete(`/api/cruise-sailings?where[ship][equals]=${TEST_SHIP}`, { headers });
  for (const id of [trainerId, secondTrainerId]) {
    await request.delete(`/api/training-sessions?where[trainer][equals]=${id}`, { headers });
    await request.delete(`/api/trainers/${id}`, { headers });
  }
  users("delete");
});

const logIn = async (page: Page) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
  await page.goto(LIST);
  await expect(page.getByRole("heading", { name: "Schedule training" })).toBeVisible();
};

/** Picks the test cruise: Ship (which sets the cruise line), Port, then Cruise dates. */
const chooseCruise = async (page: Page) => {
  const pick = async (id: string, text: string) => {
    const input = page.locator(`#${id}`);
    await input.click();
    await input.fill(text);
    await page.locator(".rs__option").filter({ hasText: text }).first().click();
  };
  await pick("training-ship", cruise.ship);
  await expect(page.locator(".training-form__field").filter({ has: page.locator("#training-cruiseLine") })).toContainText(cruise.cruiseLine);
  const port = page.locator(".training-form__field").filter({ has: page.locator("#training-port") });
  if (!(await port.innerText()).includes("Miami, Florida")) await pick("training-port", "Miami, Florida");
  await pick("training-dates", cruiseDatesLabel(cruise).split(" – ")[0]);
};

const chooseTrainer = async (page: Page) => {
  await page.locator("#training-trainer").fill(TRAINER_NAME);
  await page.keyboard.press("Enter");
};

const sessions = async (request: APIRequestContext) => {
  const response = await request.get(`/api/training-sessions?depth=0&where[trainer][equals]=${trainerId}`, { headers: await auth(request) });
  return ((await response.json()) as { docs: { type: string; timeZone: string; startsAt: string }[] }).docs;
};

test("training data requires an admin", async ({ request }) => {
  for (const path of ["/api/training-sessions", "/api/trainers", "/api/port-time-zones"]) {
    expect((await request.get(path)).status()).toBe(403);
    const editor = { Authorization: `JWT ${await token(request, EDITOR)}` };
    expect((await request.get(path, { headers: editor })).status()).toBe(403);
  }
});

test("Add to Calendar stays disabled until the form is complete", async ({ page }) => {
  await logIn(page);
  const add = page.getByRole("button", { name: "Add to Calendar" });
  await expect(add).toBeDisabled();
  await expect(page.getByText("Choose a cruise.")).toBeVisible();
  await chooseCruise(page);
  await expect(page.getByText("Choose a trainer.")).toBeVisible();
  await chooseTrainer(page);
  await expect(page.getByText("Choose a training type.")).toBeVisible();
  await page.getByLabel("Online training").check();
  await expect(add).toBeDisabled();
  await expect(page.getByText("Choose a date.")).toBeVisible();
});

test("a departure-day session is added, then a clash is refused and the form kept", async ({ page, request }) => {
  await logIn(page);
  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Departure day training").check();
  await expect(page.getByText(`${cruise.arrival} – ${cruise.departure} (America/New_York)`)).toBeVisible();
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.locator(".training-form__saved")).toContainText(`Added to the calendar: Departure day training`);
  await expect(page.getByRole("button", { name: "Add to Calendar" })).toBeDisabled();
  expect(await sessions(request)).toHaveLength(1);

  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Departure day training").check();
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.locator(".training-form__error")).toContainText("This trainer is already booked: Departure day training");
  await expect(page.getByLabel("Departure day training")).toBeChecked();
  await expect(page.getByRole("button", { name: "Add to Calendar" })).toBeEnabled();
  expect(await sessions(request)).toHaveLength(1);
});

test("an online session uses the chosen date, time, zone, and duration", async ({ page, request }) => {
  await logIn(page);
  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Online training").check();
  const date = page.getByLabel("Date", { exact: true });
  await date.fill("3 Jan 2030");
  await date.press("Enter");
  await page.getByLabel("Start time").fill("09:00");
  await page.locator("#training-zone").fill("Europe/Rome");
  await page.keyboard.press("Enter");
  await page.getByLabel("Duration").fill("4 hours");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Online training, 3 Jan 2030, 09:00 – 13:00 (Europe/Rome)")).toBeVisible();
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.locator(".training-form__saved")).toContainText("Added to the calendar: Online training");

  const online = (await sessions(request)).find((session) => session.type === "online");
  expect(online).toMatchObject({ timeZone: "Europe/Rome", startsAt: "2030-01-03T08:00:00.000Z" });
});

const entry = (page: Page, day: string, type: string) =>
  page.locator(`td:has(time[datetime="${day}"]) .training-calendar__entry--${type}`);

test("the calendar shows sessions by day, filters them, and opens their details", async ({ page, request }) => {
  const headers = await auth(request);
  const created = await request.post("/api/training-sessions", {
    headers,
    data: { cruise: cruise.id, trainer: secondTrainerId, type: "onboarding" },
  });
  expect(created.status()).toBe(201);
  const { doc: onboarding } = (await created.json()) as { doc: { id: number; endDate: string } };
  const first = cruise.startDate.slice(0, 10);
  const last = onboarding.endDate.slice(0, 10);
  const month = first.slice(0, 7);

  await logIn(page);
  await page.goto(`${LIST}?calMonth=${month}`);
  await expect(entry(page, first, "departureDay")).toContainText(`${cruise.arrival} Departure day · ${TRAINER_NAME} · ${cruise.ship}`);
  await expect(entry(page, first, "onboarding")).toContainText(`All day Onboarding · ${SECOND_NAME} · ${cruise.ship}`);
  await expect(entry(page, last, "onboarding")).toHaveCount(1);

  await page.locator("#training-filter-calType").fill("Onboarding training");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/calType=onboarding/);
  await expect(entry(page, first, "departureDay")).toHaveCount(0);
  await expect(entry(page, first, "onboarding")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(entry(page, first, "departureDay")).toHaveCount(1);
  await expect(page.getByRole("group", { name: "Filter training sessions" })).not.toContainText("Onboarding training");
  await expect(page.getByRole("button", { name: "Clear filters" })).toBeDisabled();

  await entry(page, first, "departureDay").click();
  const details = page.getByRole("region", { name: "Session details" });
  await expect(details).toContainText(`Departure day training`);
  await expect(details).toContainText(TRAINER_NAME);
  await expect(details).toContainText(`${cruise.ship} ·`);
  await expect(details.getByRole("link", { name: "Edit" })).toHaveAttribute("href", /\/admin\/collections\/training-sessions\/\d+$/);
  await details.getByRole("link", { name: "Close" }).click();
  await expect(details).toHaveCount(0);

  const title = page.locator("#training-calendar-title");
  const shown = await title.innerText();
  await page.getByRole("link", { name: "Next month" }).click();
  await expect(title).not.toHaveText(shown);
  await page.getByRole("link", { name: "Previous month" }).click();
  await expect(title).toHaveText(shown);
});

test("editing a session to clash with another is refused", async ({ page, request }) => {
  const headers = await auth(request);
  const response = await request.get(`/api/training-sessions?depth=0&where[trainer][equals]=${secondTrainerId}`, { headers });
  const { docs } = (await response.json()) as { docs: { id: number }[] };

  await logIn(page);
  await page.goto(`${LIST}/${docs[0].id}`);
  const trainer = page.locator("#field-trainer");
  await trainer.click();
  await page.locator(".rs__option").filter({ hasText: TRAINER_NAME }).click();
  await page.getByRole("button", { name: "Save" }).click();
  // Payload's error toast lists the message's comma-separated parts.
  await expect(page.locator(".toast-error")).toContainText("This trainer is already booked");
  await expect(page.locator(".toast-error")).toContainText("Departure day training");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Onboarding training · ${SECOND_NAME} · ${cruise.ship}`);
});

test("a session is deleted from its details after confirming", async ({ page, request }) => {
  await logIn(page);
  await page.goto(`${LIST}?calMonth=2030-01`);
  const online = entry(page, "2030-01-03", "online");
  await expect(online).toContainText(`09:00 Online · ${TRAINER_NAME}`);
  await online.click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("region", { name: "Session details" }).getByRole("button", { name: "Delete" }).click();
  await expect(online).toHaveCount(0);
  expect((await sessions(request)).some((session) => session.type === "online")).toBe(false);
});

test("a changed or removed cruise flags its sessions until updated", async ({ page, request }) => {
  const headers = await auth(request);
  const created = await request.post("/api/cruise-sailings", {
    headers,
    data: {
      cruiseLine: "E2E Line",
      ship: TEST_SHIP,
      startDate: "2031-03-10T12:00:00.000Z",
      endDate: "2031-03-14T12:00:00.000Z",
      startPort: "Miami, Florida",
      arrival: "07:00",
      departure: "16:00",
    },
  });
  const sailing = ((await created.json()) as { doc: { id: number } }).doc;
  const banner = page.getByRole("region", { name: /needs? review/ });
  const flagged = page.locator('td:has(time[datetime="2031-03-10"]) .training-calendar__entry--departureDay');
  const details = page.getByRole("region", { name: "Session details" });

  const session = await request.post("/api/training-sessions", {
    headers,
    data: { cruise: sailing.id, trainer: trainerId, type: "departureDay" },
  });
  expect(session.status()).toBe(201);

  await logIn(page);
  await page.goto(`${LIST}?calMonth=2031-03`);
  await expect(flagged).toBeVisible();
  await expect(flagged).not.toContainText("Review");

  await request.patch(`/api/cruise-sailings/${sailing.id}`, { headers, data: { departure: "18:00" } });
  await page.reload();
  await expect(banner).toContainText(`Departure day training · ${TRAINER_NAME} · ${TEST_SHIP}`);
  await expect(flagged).toContainText("Review");
  await flagged.click();
  await expect(details.getByRole("note", { name: "Cruise changed" })).toContainText("Departure: 16:00 → 18:00");
  await expect(details).toContainText("07:00 – 16:00");

  await details.getByRole("button", { name: "Update to current cruise details" }).click();
  await expect(details).toContainText("07:00 – 18:00");
  await expect(details.getByRole("note", { name: "Cruise changed" })).toHaveCount(0);
  await expect(flagged).not.toContainText("Review");

  await request.delete(`/api/cruise-sailings/${sailing.id}`, { headers });
  await page.reload();
  await expect(details.getByRole("note", { name: "Cruise changed" })).toContainText("no longer in the Cruise Fleet Schedule");
  await expect(details.getByRole("button", { name: "Update to current cruise details" })).toHaveCount(0);
  await expect(details).toContainText(TEST_SHIP);
});
