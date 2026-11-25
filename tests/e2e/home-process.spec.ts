import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "process";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const HOME = "/api/globals/home";
const HEADING = "E2E how we work";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

type Service = { id: number; title: string; slug: string; image?: number | null };
type Step = { service: number; title: string; description: string };
type Process = { heading: string; steps: Step[] };
let headers: Record<string, string>;
let original: Process;
let published: Service[];
let draft: Service;

// Publish explicitly: after an editor's autosave draft, a save without _status stays a draft.
const save = (request: APIRequestContext, steps: Step[]) =>
  request.post(HOME, { headers, data: { _status: "published", process: { heading: HEADING, steps } } });

const step = (service: Service, index: number): Step => ({
  service: service.id,
  title: `E2E step ${index + 1}`,
  description: `E2E description ${index + 1}.`,
});

const section = (page: Page) => page.getByRole("region", { name: HEADING });

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
  const home = (await (await request.get(`${HOME}?depth=0`)).json()) as { process: Process };
  original = {
    heading: home.process.heading,
    steps: (home.process.steps ?? []).map(({ service, title, description }) => ({ service, title, description })),
  };
  // The login cookie makes this request an admin's, which also sees drafts: ask for published only.
  const list = await request.get("/api/services?where[_status][equals]=published&sort=sortOrder,title&limit=50&depth=0");
  published = ((await list.json()) as { docs: Service[] }).docs;
  expect(published.length).toBeGreaterThanOrEqual(4);
  const created = await request.post("/api/services?draft=true", {
    headers,
    data: { title: "E2E draft service", summary: "Not published.", _status: "draft" },
  });
  expect(created.ok()).toBe(true);
  draft = ((await created.json()) as { doc: Service }).doc;
});

test.afterAll(async ({ request }) => {
  await request.post(HOME, { headers, data: { _status: "published", process: original } });
  await request.delete(`/api/services/${draft.id}`, { headers });
  users("delete");
});

test("shows a numbered card per step, in step order, with its service's photo and link", async ({ page, request }) => {
  const [a, b, c, d] = published;
  expect((await save(request, [c, a, b, d].map(step))).ok()).toBe(true);
  await page.goto("/");
  const cards = section(page).getByRole("listitem");
  await expect(cards.getByRole("heading", { level: 3 })).toHaveText(["E2E step 1", "E2E step 2", "E2E step 3", "E2E step 4"]);
  await expect(cards.first()).toContainText("1");
  // Same name size as the Featured products cards.
  expect(await cards.first().getByRole("heading").evaluate((el) => getComputedStyle(el).fontSize)).toBe("17px");
  const withImages = [c, a, b, d].filter((service) => service.image).length;
  await expect(section(page).locator("article img")).toHaveCount(withImages);
  expect(withImages).toBeGreaterThan(0);
  await section(page).getByRole("link", { name: "E2E step 1", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/services#${c.slug}$`));
});

test("on desktop, 4 steps form a loop: right, down, left, then up back to the first", async ({ page, request }) => {
  expect((await save(request, published.slice(0, 4).map(step))).ok()).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const [one, two, three, four] = await section(page)
    .getByRole("listitem")
    .evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect()).map(({ x, y }) => ({ x, y })));
  expect(two.y).toBe(one.y);
  expect(two.x).toBeGreaterThan(one.x);
  expect(three.x).toBe(two.x);
  expect(three.y).toBeGreaterThan(two.y);
  expect(four.y).toBe(three.y);
  expect(four.x).toBe(one.x);
  // The return to the first step is only drawn (the up arrow), so it is spelled out for screen readers.
  await expect(section(page).getByText("Then back to E2E step 1")).toHaveCSS("position", "absolute");
});

test("leaves out a step whose service is unpublished, renumbers the rest, and stacks them", async ({ page, request }) => {
  const [a, b, c] = published;
  const steps = [step(draft, 0), step(a, 1), step(b, 2), step(c, 3)];
  expect((await save(request, steps)).ok()).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(section(page).getByRole("heading", { level: 3 })).toHaveText(["E2E step 2", "E2E step 3", "E2E step 4"]);
  await expect(section(page).getByRole("listitem").first()).toContainText("1");
  const xs = await section(page).getByRole("listitem").evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().x));
  expect(new Set(xs).size).toBe(1);
  await expect(section(page).getByText("Then back to E2E step 2")).toBeVisible();
});

test("hides the section without steps", async ({ page, request }) => {
  expect((await save(request, [])).ok()).toBe(true);
  await page.goto("/");
  await expect(section(page)).toHaveCount(0);
});

test("accepts exactly 4 steps", async ({ request }) => {
  expect((await save(request, published.slice(0, 3).map(step))).status()).toBe(400);
  const five = [...published.slice(0, 4), published[0]].map(step);
  expect((await save(request, five)).status()).toBe(400);
});

// In this file, not its own: specs in parallel workers writing the Home global overwrite each other's pages.
test.describe("Success story spotlight", () => {
  const SPOTLIGHT = "E2E success story";
  type Story = { id: number; title: string; slug: string; summary: string };
  type Spotlight = { heading: string; story: number | null };
  let originalSpotlight: Spotlight;
  let story: Story;
  let draftStory: Story;

  const choose = (request: APIRequestContext, id: number | null) =>
    request.post(HOME, { headers, data: { _status: "published", spotlight: { heading: SPOTLIGHT, story: id } } });
  const spotlight = (page: Page) => page.getByRole("region", { name: SPOTLIGHT });

  test.beforeAll(async ({ request }) => {
    const home = (await (await request.get(`${HOME}?depth=0`)).json()) as { spotlight?: Spotlight };
    originalSpotlight = { heading: home.spotlight?.heading ?? "Success story", story: home.spotlight?.story ?? null };
    const list = await request.get("/api/success-stories?where[_status][equals]=published&limit=1&depth=0");
    [story] = ((await list.json()) as { docs: Story[] }).docs;
    expect(story).toBeDefined();
    const created = await request.post("/api/success-stories?draft=true", {
      headers,
      data: { title: "E2E draft story", summary: "Not published.", _status: "draft" },
    });
    expect(created.ok()).toBe(true);
    draftStory = ((await created.json()) as { doc: Story }).doc;
  });

  test.afterAll(async ({ request }) => {
    await request.post(HOME, { headers, data: { _status: "published", spotlight: originalSpotlight } });
    await request.delete(`/api/success-stories/${draftStory.id}`, { headers });
  });

  test("shows the chosen story's image, title, and summary, linking to the story", async ({ page, request }) => {
    expect((await choose(request, story.id)).ok()).toBe(true);
    await page.goto("/");
    await expect(spotlight(page).getByRole("heading", { level: 3 })).toHaveText(story.title);
    await expect(spotlight(page)).toContainText(story.summary);
    await expect(spotlight(page).locator("img")).toHaveCount(1);
    await expect(spotlight(page)).not.toContainText("Development placeholder");
    await spotlight(page).getByRole("link", { name: "Read the story" }).click();
    await expect(page).toHaveURL(new RegExp(`/success-stories/${story.slug}$`));
  });

  test("is hidden from visitors without a story or with an unpublished one", async ({ page, request }) => {
    expect((await choose(request, null)).ok()).toBe(true);
    await page.goto("/");
    await expect(spotlight(page)).toHaveCount(0);

    expect((await choose(request, draftStory.id)).ok()).toBe(true);
    await page.goto("/");
    await expect(spotlight(page)).toHaveCount(0);
    await expect(page.getByText("E2E draft story")).toHaveCount(0);
  });
});
