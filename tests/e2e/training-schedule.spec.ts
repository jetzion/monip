import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { initialsOf } from "../../lib/admin/initials";
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
// No home base, so in-person training needs travel.
const TRAVELLER = { firstName: "E2E", lastName: `Traveller ${RUN}` };
const TRAVELLER_NAME = `E2E Traveller ${RUN}`;
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
let travellerId: number;
let cruise: Cruise;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const headers = await auth(request);
  // Based in Miami, the test cruise's port, so their sessions need no travel.
  const miami = await request.get("/api/port-time-zones?limit=1&depth=0&where[port][equals]=Miami, Florida", { headers });
  const homeBase = ((await miami.json()) as { docs: { id: number }[] }).docs[0].id;
  const created = await request.post("/api/trainers", { headers, data: { ...TRAINER, homeBase } });
  trainerId = ((await created.json()) as { doc: { id: number } }).doc.id;
  const traveller = await request.post("/api/trainers", { headers, data: TRAVELLER });
  travellerId = ((await traveller.json()) as { doc: { id: number } }).doc.id;
  const second = await request.post("/api/trainers", { headers, data: { ...SECOND_TRAINER, homeBase } });
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
  for (const id of [trainerId, secondTrainerId, travellerId]) {
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
  await page.getByLabel("Online training", { exact: true }).check();
  await expect(add).toBeDisabled();
  await expect(page.getByText("Choose a date.")).toBeVisible();
});

test("a cruise can be chosen Port first, then Cruise line, then Ship", async ({ page }) => {
  await logIn(page);
  const field = (id: string) => page.locator(".training-form__field").filter({ has: page.locator(`#${id}`) });
  const pick = async (id: string, text: string) => {
    await page.locator(`#${id}`).click();
    await page.locator(`#${id}`).fill(text);
    await page.locator(".rs__option").filter({ hasText: text }).first().click();
  };
  await pick("training-port", "Miami, Florida");
  await pick("training-cruiseLine", cruise.cruiseLine);
  await pick("training-ship", cruise.ship);
  // The port chosen first is kept, and the ship's sailings from it load.
  await expect(field("training-port")).toContainText("Miami, Florida");
  await expect(field("training-cruiseLine")).toContainText(cruise.cruiseLine);
  await pick("training-dates", cruiseDatesLabel(cruise).split(" – ")[0]);
  await expect(page.getByText("Choose a cruise.")).toHaveCount(0);
});

test("a departure-day session is added, then a clash is refused and the form kept", async ({ page, request }) => {
  await logIn(page);
  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Departure day training", { exact: true }).check();
  await expect(page.getByText(`${cruise.arrival} – ${cruise.departure} (America/New_York)`)).toBeVisible();
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.locator(".training-form__saved")).toContainText(`Added to the calendar: Departure day training`);
  await expect(page.getByRole("button", { name: "Add to Calendar" })).toBeDisabled();
  expect(await sessions(request)).toHaveLength(1);

  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Departure day training", { exact: true }).check();
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.locator(".training-form__error")).toContainText("This trainer is already booked: Departure day training");
  await expect(page.getByLabel("Departure day training", { exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Add to Calendar" })).toBeEnabled();
  expect(await sessions(request)).toHaveLength(1);
});

test("a trainer away from home base gets a suggested trip and an acknowledged estimate", async ({ page, request }) => {
  const cruiseDay = cruise.startDate.slice(0, 10);
  const dayBefore = new Date(Date.parse(`${cruiseDay}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const headers = await auth(request);
  // Miami rates for this test only (only travel estimates read port rates).
  type Zone = { id: number; flightFare?: number | null; hotelPerNight?: number | null; rideshareFare?: number | null };
  const miami = ((await (await request.get("/api/port-time-zones?depth=0&where[port][equals]=Miami, Florida", { headers })).json()) as { docs: Zone[] })
    .docs[0];
  await request.patch(`/api/port-time-zones/${miami.id}`, { headers, data: { flightFare: 250, hotelPerNight: 180, rideshareFare: 40 } });
  try {
    await logIn(page);
    await chooseCruise(page);
    await page.locator("#training-trainer").fill(TRAVELLER_NAME);
    await page.keyboard.press("Enter");
    await page.getByLabel("Departure day training", { exact: true }).check();

    const travel = page.getByRole("group", { name: "Travel" });
    const check = page.locator(".training-form__check");
    const add = page.getByRole("button", { name: "Add to Calendar" });
    await expect(travel.getByLabel("Departure date")).toHaveValue(dayBefore);
    await expect(travel.getByLabel("Return date")).toHaveValue(cruiseDay);
    await expect(check).toHaveText("Enter the departure city.");
    await expect(add).toBeDisabled();

    await travel.getByLabel("Departure city").fill("Orlando, Florida");
    await travel.getByLabel("Air travel needed").check();
    await expect(check).toHaveText("Enter the departing airport.");
    await travel.getByLabel("Departing airport").fill("MCO");
    await travel.getByLabel("Destination airport", { exact: true }).fill("MIA");
    await travel.getByLabel("Hotel needed").check();
    await travel.getByLabel("Car rental needed").check();
    await travel.getByLabel("Return date").fill(dayBefore);
    await expect(check).toContainText("The return date must be on or after the training ends");
    await travel.getByLabel("Return date").fill(cruiseDay);
    await expect(check).toHaveText("Click Estimate cost to see the travel cost.");

    // Prices found online (a stand-in for the Firecrawl lookup) for flight and hotel;
    // rideshare falls back to Miami's rate; car rental has neither, so it is entered.
    const lookups: string[] = [];
    await page.route("**/api/training-sessions/estimate", async (route) => {
      lookups.push(route.request().postData() ?? "");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        json: {
          prices: {
            flight: { usd: 157, sourceUrl: "https://www.aa.com/en-us/flights-from-orlando-to-miami", note: "Fares from $157 round trip." },
            hotel: { usd: 135.5, sourceUrl: "https://www.hotelplanner.com/near-portmiami", note: "Average 3-star near the port." },
          },
        },
      });
    });
    await page.getByRole("button", { name: "Estimate cost" }).click();
    await expect(page.getByRole("status").filter({ hasText: "This takes about a minute." })).toBeVisible();
    // The searching icon sits at the top center of the screen while prices are looked up.
    const searching = page.locator(".training-estimate__searching img[src='/searching-icon.svg']");
    await expect(searching).toBeVisible();
    const box = (await searching.boundingBox())!;
    const width = page.viewportSize()!.width;
    expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(2);
    expect(box.y).toBeLessThan(200);
    await expect(check).toHaveText("Looking up current prices online.");
    const estimate = page.getByRole("table", { name: "Estimated travel cost (US dollars)" });
    const flight = estimate.getByRole("row", { name: /Flight MCO – MIA/ });
    await expect(flight).toContainText("Fares from $157 round trip.");
    await expect(flight.getByRole("link", { name: "Found online (aa.com)" })).toHaveAttribute("href", "https://www.aa.com/en-us/flights-from-orlando-to-miami");
    await expect(estimate.getByRole("row", { name: /Hotel/ })).toContainText("1 night × $135.50");
    await expect(estimate.getByRole("row", { name: /Car rental/ })).toContainText("No price found or rate set: enter an amount");
    // Only the trip goes to the lookup: airports, dates, city, and port; never the trainer.
    expect(lookups).toHaveLength(1);
    expect(JSON.parse(lookups[0])).toMatchObject({ port: "Miami, Florida", travel: { departureAirport: "MCO", destinationAirport: "MIA" } });
    expect(lookups[0]).not.toContain(TRAVELLER_NAME);
    const acknowledge = page.getByLabel(/I acknowledge the estimated travel cost/);
    await expect(acknowledge).toBeDisabled();
    await page.getByLabel("Car rental amount").fill("70");
    await expect(estimate.getByRole("row", { name: "Total" })).toContainText("$362.50");
    await expect(check).toHaveText("Acknowledge the estimated travel cost.");
    await acknowledge.check();
    await expect(add).toBeEnabled();
    await add.click();
    await expect(page.locator(".training-form__saved")).toContainText("Added to the calendar: Departure day training");

    type Saved = { id: number; startsAt: string; blockedFrom: string; travel: Record<string, unknown>; estimate: Record<string, unknown> };
    const find = async () =>
      ((await (await request.get(`/api/training-sessions?depth=0&where[trainer][equals]=${travellerId}`, { headers })).json()) as { docs: Saved[] })
        .docs[0];
    const saved = await find();
    expect(saved.travel).toMatchObject({ departureCity: "Orlando, Florida", airTravel: true, departureAirport: "MCO", hotel: true, carRental: true });
    expect(String(saved.travel.hotelCheckIn).slice(0, 10)).toBe(dayBefore);
    expect(saved.blockedFrom < saved.startsAt).toBe(true);
    expect(saved.estimate).toMatchObject({ total: 362.5, acknowledgedBy: ADMIN });
    expect((saved.estimate.lines as { url?: string }[])[0].url).toBe("https://www.aa.com/en-us/flights-from-orlando-to-miami");

    const details = `${LIST}?calMonth=${cruiseDay.slice(0, 7)}&calTrainer=${travellerId}&calSession=${saved.id}`;
    await page.goto(details);
    const region = page.getByRole("region", { name: "Session details" });
    await expect(region).toContainText("Estimated travel cost: $362.50");
    await expect(region).toContainText("From Orlando, Florida");

    // The travel day blocks the trainer.
    const online = { cruise: cruise.id, trainer: travellerId, type: "online", startTime: "10:00", timeZone: "America/New_York", durationHours: "2" };
    const clash = await request.post("/api/training-sessions", { headers, data: { ...online, date: `${dayBefore}T12:00:00.000Z` } });
    expect(clash.status()).toBe(400);
    expect(await clash.text()).toContain("This trainer is already booked (travel days included)");

    // The server checks the trip too.
    const early = await request.patch(`/api/training-sessions/${saved.id}`, {
      headers,
      data: { travel: { ...saved.travel, returnDate: `${dayBefore}T12:00:00.000Z` } },
    });
    expect(early.status()).toBe(400);
    expect(await early.text()).toContain("The return date must be on or after the training ends");

    // A changed trip needs a new estimate, made in the details.
    expect((await request.patch(`/api/training-sessions/${saved.id}`, { headers, data: { travel: { ...saved.travel, rideshare: true } } })).ok()).toBe(true);
    await page.goto(details);
    await expect(page.locator(".training-calendar__travel").first()).toHaveText("Estimate");
    await expect(region).toContainText("Estimate needed");
    await region.getByRole("button", { name: "Estimate cost" }).click();
    await expect(region.getByRole("row", { name: /Rideshare/ })).toContainText("2 trips × $40.00");
    await region.getByLabel("Car rental amount").fill("70");
    await region.getByLabel(/I acknowledge the estimated travel cost of \$442\.50/).check();
    await region.getByRole("button", { name: "Save travel and estimate" }).click();
    await expect(region).toContainText("Estimated travel cost: $442.50");
    await expect(page.locator(".training-calendar__travel")).toHaveCount(0);

    // A session made without travel (as the planner does) needs it.
    await request.delete(`/api/training-sessions/${saved.id}`, { headers });
    const bare = await request.post("/api/training-sessions", { headers, data: { cruise: cruise.id, trainer: travellerId, type: "departureDay" } });
    const bareId = ((await bare.json()) as { doc: { id: number } }).doc.id;
    await page.goto(`${LIST}?calMonth=${cruiseDay.slice(0, 7)}&calTrainer=${travellerId}&calSession=${bareId}`);
    await expect(region).toContainText("Travel details needed");
    await expect(page.locator(".training-calendar__travel").first()).toHaveText("Travel");

    // The trip is added in the details, with suggested dates, and its cost estimated there.
    const trip = region.getByRole("group", { name: "Travel" });
    await expect(trip.getByLabel("Departure date")).toHaveValue(dayBefore);
    await expect(trip.getByLabel("Return date")).toHaveValue(cruiseDay);
    await expect(region).toContainText("Enter the departure city.");
    await expect(region.getByRole("button", { name: "Estimate cost" })).toHaveCount(0);
    await trip.getByLabel("Departure city").fill("Orlando, Florida");
    await trip.getByLabel("Air travel needed").check();
    await trip.getByLabel("Departing airport").fill("MCO");
    await trip.getByLabel("Destination airport", { exact: true }).fill("MIA");
    await region.getByRole("button", { name: "Estimate cost" }).click();
    await expect(region.getByRole("row", { name: /Flight MCO – MIA/ })).toContainText("Found online (aa.com)");
    await region.getByLabel(/I acknowledge the estimated travel cost of \$157\.00/).check();
    await region.getByRole("button", { name: "Save travel and estimate" }).click();
    await expect(region).toContainText("Estimated travel cost: $157.00");
    await expect(page.locator(".training-calendar__travel")).toHaveCount(0);
    const planned = (await (await request.get(`/api/training-sessions/${bareId}?depth=0`, { headers })).json()) as Saved;
    expect(planned.travel).toMatchObject({ departureCity: "Orlando, Florida", airTravel: true, departureAirport: "MCO" });
    expect(planned.estimate).toMatchObject({ total: 157, acknowledgedBy: ADMIN });
    // The calendar tests below count this run's sessions by day.
    await request.delete(`/api/training-sessions/${bareId}`, { headers });
  } finally {
    await request.patch(`/api/port-time-zones/${miami.id}`, {
      headers,
      data: { flightFare: miami.flightFare ?? null, hotelPerNight: miami.hotelPerNight ?? null, rideshareFare: miami.rideshareFare ?? null },
    });
  }
});

test("travel can be added at home base, and is needed when the cruise ends elsewhere", async ({ page, request }) => {
  const headers = await auth(request);
  // A test cruise from Miami (the trainer's home base) to Barcelona.
  const ship = `E2E Ends Elsewhere ${RUN}`;
  const created = await request.post("/api/cruise-sailings", {
    headers,
    data: { cruiseLine: "E2E Line", ship, startDate: "2030-04-07T12:00:00.000Z", endDate: "2030-04-19T12:00:00.000Z", nights: 12, startPort: "Miami, Florida", endPort: "Barcelona, Spain" },
  });
  expect(created.ok(), await created.text()).toBe(true);
  const sailingId = ((await created.json()) as { doc: { id: number } }).doc.id;
  // The option starts like "7 Apr – 19 Apr 2030".
  const dates = cruiseDatesLabel({ id: 0, ship, cruiseLine: "E2E Line", startDate: "2030-04-07T12:00:00.000Z", endDate: "2030-04-19T12:00:00.000Z" }).split(" – ")[0];
  try {
    await logIn(page);
    const pick = async (id: string, text: string) => {
      await page.locator(`#${id}`).click();
      await page.locator(`#${id}`).fill(text);
      await page.locator(".rs__option").filter({ hasText: text }).first().click();
    };
    await pick("training-ship", ship);
    await pick("training-dates", dates);
    await chooseTrainer(page);
    const travel = page.getByRole("group", { name: "Travel" });
    const wanted = page.getByLabel("Travel needed (the trainer is based at this port)");

    // Onboarding from Miami to Barcelona: the trainer must fly home.
    await page.getByLabel("Onboarding training", { exact: true }).check();
    await expect(wanted).toHaveCount(0);
    await expect(travel).toContainText("This cruise ends in Barcelona, Spain");
    await expect(travel.getByLabel("Departure date")).toHaveValue("2030-04-07");
    await expect(travel.getByLabel("Return date")).toHaveValue("2030-04-19");
    await travel.getByLabel("Air travel needed").check();
    await expect(travel.getByLabel("Return from airport")).toHaveAttribute("placeholder", "Nearest Barcelona, Spain");

    // Departure day at home base: no trip unless Travel needed is ticked.
    await page.getByLabel("Departure day training", { exact: true }).check();
    await expect(page.locator(".training-form__check")).toContainText("no arrival and departure times");
    await request.patch(`/api/cruise-sailings/${sailingId}`, { headers, data: { arrival: "07:00", departure: "16:00" } });
    await page.reload();
    await pick("training-ship", ship);
    await pick("training-dates", dates);
    await chooseTrainer(page);
    await page.getByLabel("Departure day training", { exact: true }).check();
    await expect(travel).toHaveCount(0);
    await wanted.check();
    await expect(travel).toBeVisible();
    await expect(travel.getByLabel("Departure city")).toHaveValue("Miami, Florida");
    await expect(page.getByRole("button", { name: "Estimate cost" })).toBeVisible();
    await wanted.uncheck();
    await expect(travel).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add to Calendar" })).toBeEnabled();
  } finally {
    await request.delete(`/api/cruise-sailings/${sailingId}`, { headers });
  }
});

test("an online session uses the chosen date, time, zone, and duration", async ({ page, request }) => {
  await logIn(page);
  await chooseCruise(page);
  await chooseTrainer(page);
  await page.getByLabel("Online training", { exact: true }).check();
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

/** This run's calendar entries only: real sessions in the shared database may fall on the same day. */
const entry = (page: Page, day: string, type: string) =>
  // Entries show initials and ship; the full description (with the trainer's name) is the accessible name.
  page.locator(`td:has(time[datetime="${day}"]) .training-calendar__entry--${type}[aria-label*="${RUN}"]`);

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
  await expect(entry(page, first, "departureDay")).toContainText(`${initialsOf(TRAINER_NAME, null)} - ${cruise.ship}`);
  await expect(entry(page, first, "departureDay")).toHaveAttribute("aria-label", new RegExp(`${cruise.arrival} – .* · ${TRAINER_NAME} · `));
  await expect(entry(page, first, "onboarding")).toContainText(`${initialsOf(SECOND_NAME, null)} - ${cruise.ship}`);
  await expect(entry(page, first, "onboarding")).toHaveAttribute("aria-label", new RegExp(`^Onboarding training, .* · ${SECOND_NAME} · `));
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
  await expect(online).toContainText(`${initialsOf(TRAINER_NAME, null)} - ${cruise.ship}`);
  await expect(online).toHaveAttribute("aria-label", new RegExp(`^Online training, 3 Jan 2030, 09:00 – .* · ${TRAINER_NAME} · `));
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

test("the cruise fields are ordered By Cruise/Ship (default) or By port", async ({ page }) => {
  await logIn(page);
  const order = page.getByRole("group", { name: "Choose the cruise" });
  await expect(order.getByLabel("By Cruise/Ship")).toBeChecked();
  // No visible label beside the buttons.
  await expect(page.getByText("Choose the cruise", { exact: true })).toHaveCount(0);
  const labels = page.locator(".training-form__fields > .training-form__field > label");
  await expect(labels).toHaveText(["Cruise line", "Ship", "Port", "Cruise dates", "Trainer"]);
  await expect(page.locator(".training-form__fields > fieldset > legend")).toHaveText(["Training type"]);

  // A choice made first is kept when the order changes.
  await page.locator("#training-ship").fill(cruise.ship);
  await page.locator(".rs__option").filter({ hasText: cruise.ship }).first().click();
  await order.getByLabel("By port").check();
  await expect(labels).toHaveText(["Port", "Cruise line", "Ship", "Cruise dates", "Trainer"]);
  await expect(page.locator(".training-form__field").filter({ has: page.locator("#training-ship") })).toContainText(cruise.ship);
});

test("clearing the cruise line clears the ship too", async ({ page }) => {
  await logIn(page);
  const field = (id: string) => page.locator(".training-form__field").filter({ has: page.locator(`#${id}`) });
  await page.locator("#training-ship").fill(cruise.ship);
  await page.locator(".rs__option").filter({ hasText: cruise.ship }).first().click();
  await expect(field("training-cruiseLine")).toContainText(cruise.cruiseLine);
  const port = page.locator(".training-form__field").filter({ has: page.locator("#training-port") });
  if (!(await port.innerText()).includes("Miami, Florida")) {
    await page.locator("#training-port").fill("Miami, Florida");
    await page.locator(".rs__option").filter({ hasText: "Miami, Florida" }).first().click();
  }

  await field("training-cruiseLine").locator(".clear-indicator").click();
  await expect(field("training-cruiseLine")).not.toContainText(cruise.cruiseLine);
  await expect(field("training-ship")).not.toContainText(cruise.ship);
  await expect(field("training-port")).toContainText("Miami, Florida");
  await expect(page.locator("#training-dates")).toBeDisabled();
});
