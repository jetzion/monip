import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "invite";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const EDITOR = `e2e-${USER_SET}-editor@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const SETTINGS = "/api/globals/chat-invitation";
const PAGES = ["home", "products", "product", "services", "stories", "story", "about", "clients"];
const QUESTIONS: Record<string, string> = {
  home: "E2E home question?",
  services: "E2E services question?",
  product: "E2E product question?",
};

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

const auth = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return { Authorization: `JWT ${((await response.json()) as { token: string }).token}` };
};

type Settings = { enabled?: boolean | null; timesPerVisit?: number | null; questions?: Record<string, unknown> };
let original: Settings;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  original = (await (await request.get(`${SETTINGS}?depth=0`)).json()) as Settings;
  const questions = Object.fromEntries(PAGES.map((page) => [page, QUESTIONS[page] ? [{ question: QUESTIONS[page] }] : []]));
  const response = await request.post(SETTINGS, { headers: await auth(request, ADMIN), data: { enabled: true, questions } });
  expect(response.ok()).toBe(true);
});

test.afterAll(async ({ request }) => {
  await request.post(SETTINGS, {
    headers: await auth(request, ADMIN),
    data: {
      enabled: original.enabled ?? false,
      timesPerVisit: original.timesPerVisit ?? 1,
      questions: original.questions ?? Object.fromEntries(PAGES.map((page) => [page, []])),
    },
  });
  users("delete");
});

const bubble = (page: Page) => page.getByRole("status").getByRole("button");

/** Advances the paused clock in small steps so React renders between timers. */
async function advance(page: Page, ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 250) await page.clock.runFor(250);
}

async function setTabVisibility(page: Page, state: "hidden" | "visible") {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { get: () => value, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

test.describe("timing", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1_000);
  });

  test("appears after 5 seconds, leaves after 10, and only once per visit", async ({ page }) => {
    await page.goto("/");
    await advance(page, 4_750);
    await expect(bubble(page)).toHaveCount(0);
    await advance(page, 500);
    await expect(bubble(page)).toHaveText(QUESTIONS.home);
    // Amber (--highlight), so it stands out from the indigo chat button.
    await expect(bubble(page)).toHaveCSS("background-color", "rgb(245, 165, 36)");
    await advance(page, 9_500);
    await expect(bubble(page)).toBeVisible();
    await advance(page, 1_000);
    await expect(bubble(page)).toHaveCount(0);

    await page.getByRole("link", { name: "Services", exact: true }).first().click();
    await page.waitForURL("**/services");
    await advance(page, 12_000);
    await expect(bubble(page)).toHaveCount(0);
  });

  test("leaving a page early restarts the delay with the next page's question", async ({ page }) => {
    await page.goto("/");
    await advance(page, 3_000);
    await page.getByRole("link", { name: "Services", exact: true }).first().click();
    await page.waitForURL("**/services");
    await advance(page, 3_000);
    await expect(bubble(page)).toHaveCount(0);
    await advance(page, 2_250);
    await expect(bubble(page)).toHaveText(QUESTIONS.services);
  });

  test("hovering keeps it open and clicking opens the chat", async ({ page }) => {
    await page.goto("/");
    await advance(page, 5_250);
    await bubble(page).hover();
    await advance(page, 10_000);
    await expect(bubble(page)).toBeVisible();
    await bubble(page).click();
    await expect(page.getByRole("region", { name: "Chat with us" })).toBeVisible();
    await expect(bubble(page)).toHaveCount(0);
  });

  test("opening the chat first cancels the invitation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Chat with us" }).click();
    await advance(page, 8_000);
    await expect(bubble(page)).toHaveCount(0);
  });

  test("the delay only counts while the tab is visible", async ({ page }) => {
    await page.goto("/");
    await advance(page, 3_000);
    await setTabVisibility(page, "hidden");
    await advance(page, 10_000);
    await expect(bubble(page)).toHaveCount(0);
    await setTabVisibility(page, "visible");
    await advance(page, 1_500);
    await expect(bubble(page)).toHaveCount(0);
    await advance(page, 750);
    await expect(bubble(page)).toBeVisible();
  });

  test("never on Contact, and not on a page without questions", async ({ page }) => {
    for (const path of ["/contact", "/clients"]) {
      await page.goto(path);
      await advance(page, 8_000);
      await expect(bubble(page)).toHaveCount(0);
    }
  });

  test("product pages show a product question", async ({ page }) => {
    await page.goto("/products");
    await page.locator('main a[href^="/products/"]').first().click();
    await page.waitForURL("**/products/*");
    await advance(page, 5_250);
    await expect(bubble(page)).toHaveText(QUESTIONS.product);
  });

  test("records shown and clicked in Web Analytics", async ({ page }) => {
    await page.goto("/");
    await advance(page, 5_250);
    await bubble(page).click();
    const events = await page.evaluate(() => (window.vaq ?? []).filter(([type]) => type === "event").map(([, data]) => data));
    expect(events).toEqual([
      { name: "Chat invitation shown", data: { page: "home", question: QUESTIONS.home } },
      { name: "Chat invitation clicked", data: { page: "home", question: QUESTIONS.home } },
    ]);
  });

  test("shows on as many pages per visit as the admin allows", async ({ page, request }) => {
    const headers = await auth(request, ADMIN);
    await request.post(SETTINGS, { headers, data: { timesPerVisit: 2 } });
    try {
      for (const [path, question] of [["/", QUESTIONS.home], ["/services", QUESTIONS.services]]) {
        await page.goto(path);
        await advance(page, 5_250);
        await expect(bubble(page)).toHaveText(question);
        await advance(page, 11_000);
      }
      await page.goto("/");
      await advance(page, 8_000);
      await expect(bubble(page)).toHaveCount(0);
    } finally {
      await request.post(SETTINGS, { headers, data: { timesPerVisit: 1 } });
    }
  });

  test.describe("laptop", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("sits beside the chat button, clear of the hero video controls", async ({ page }) => {
      await page.goto("/");
      await advance(page, 5_250);
      const box = (await bubble(page).boundingBox())!;
      const button = (await page.getByRole("button", { name: "Chat with us" }).boundingBox())!;
      const pause = (await page.getByRole("button", { name: /background video/ }).boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(button.x);
      expect(Math.abs(box.y + box.height - (button.y + button.height))).toBeLessThanOrEqual(1);
      const overlaps = box.x < pause.x + pause.width && pause.x < box.x + box.width && box.y < pause.y + pause.height && pause.y < box.y + box.height;
      expect(overlaps).toBe(false);
    });
  });

  test.describe("phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("fits the screen above the chat button", async ({ page }) => {
      await page.goto("/");
      await advance(page, 5_250);
      const box = (await bubble(page).boundingBox())!;
      const button = (await page.getByRole("button", { name: "Chat with us" }).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeLessThanOrEqual(button.y);
    });
  });
});

test("no WCAG violations with the invitation showing", async ({ page }) => {
  await page.goto("/");
  await bubble(page).hover({ timeout: 10_000 });
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("only admins can switch the invitation or change times per visit", async ({ request }) => {
  const response = await request.post(SETTINGS, {
    headers: await auth(request, EDITOR),
    data: { enabled: false, timesPerVisit: 5 },
  });
  expect(response.ok()).toBe(true);
  const settings = (await (await request.get(SETTINGS)).json()) as Settings;
  expect(settings.enabled).toBe(true);
  expect(settings.timesPerVisit).toBe(1);
});

test("times per visit must be a whole number from 1 to 10", async ({ request }) => {
  const headers = await auth(request, ADMIN);
  for (const timesPerVisit of [0, 11, 2.5]) {
    const response = await request.post(SETTINGS, { headers, data: { timesPerVisit } });
    expect(response.status()).toBe(400);
  }
});
