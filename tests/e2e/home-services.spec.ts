import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "services";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const HOME = "/api/globals/home";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

type Service = { id: number; title: string; slug: string; image?: number | null };
let headers: Record<string, string>;
let original: number[];
let published: Service[];
let draft: Service;

// Publish explicitly: after an editor's autosave draft, a save without _status stays a draft.
const choose = (request: APIRequestContext, ids: number[]) =>
  request.post(HOME, { headers, data: { _status: "published", featuredServices: ids } });

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
  original = ((await (await request.get(`${HOME}?depth=0`)).json()) as { featuredServices?: number[] }).featuredServices ?? [];
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
  await choose(request, original);
  await request.delete(`/api/services/${draft.id}`, { headers });
  users("delete");
});

const cardTitles = (page: Page) =>
  page.getByRole("region", { name: "Our services" }).getByRole("article").getByRole("heading");

test("shows the first 4 services by sort order when none are chosen", async ({ page, request }) => {
  expect((await choose(request, [])).ok()).toBe(true);
  await page.goto("/");
  await expect(cardTitles(page)).toHaveText(published.slice(0, 4).map((service) => service.title));
  // Each card shows its service's image (url needs filename selected in the query).
  const withImages = published.slice(0, 4).filter((service) => service.image).length;
  await expect(page.getByRole("region", { name: "Our services" }).locator("article img")).toHaveCount(withImages);
  expect(withImages).toBeGreaterThan(0);
});

test("shows the chosen services in the chosen order, linking to the Services page", async ({ page, request }) => {
  const [a, b, c] = published;
  expect((await choose(request, [c.id, a.id, b.id])).ok()).toBe(true);
  await page.goto("/");
  await expect(cardTitles(page)).toHaveText([c.title, a.title, b.title]);
  await page.getByRole("link", { name: a.title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/services#${a.slug}$`));
});

test("leaves out an unpublished service", async ({ page, request }) => {
  expect((await choose(request, [draft.id, published[0].id])).ok()).toBe(true);
  await page.goto("/");
  await expect(cardTitles(page)).toHaveText([published[0].title]);
});

test("rejects more than 4 services", async ({ request }) => {
  const five = [...published.slice(0, 4), draft].map((service) => service.id);
  expect((await choose(request, five)).status()).toBe(400);
});
