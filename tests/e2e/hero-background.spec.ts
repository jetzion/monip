import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "hero";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const HOME = "/api/globals/home";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

type Hero = Record<string, unknown>;
let original: Hero;
let headers: Record<string, string>;
let images: number[];
let videoId: number;

// Fixed slideshow settings, so editors' current values cannot break the tests.
const BASELINE = { transition: "fade", transitionSeconds: 1.2, overlayOpacity: 100 };

// Publish explicitly: without _status, a save after an editor's autosave draft stays a
// draft, which unpublishes the Home page for visitors.
const saveHero = (request: APIRequestContext, hero: Hero) =>
  request.post(HOME, { headers, data: { _status: "published", hero: { ...original, ...BASELINE, ...hero } } });

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
  original = ((await (await request.get(`${HOME}?depth=0`)).json()) as { hero: Hero }).hero;

  const media = await request.get("/api/media?where[mimeType][in]=image/jpeg,image/png&limit=2&depth=0");
  images = ((await media.json()) as { docs: { id: number }[] }).docs.map((doc) => doc.id);
  expect(images).toHaveLength(2);

  const upload = await request.post("/api/media", {
    headers,
    multipart: {
      _payload: JSON.stringify({ alt: "E2E hero video" }),
      file: { name: "e2e-hero.mp4", mimeType: "video/mp4", buffer: readFileSync("public/hero/decoration.mp4") },
    },
  });
  expect(upload.ok()).toBe(true);
  videoId = ((await upload.json()) as { doc: { id: number } }).doc.id;
});

test.afterAll(async ({ request }) => {
  await request.post(HOME, { headers, data: { _status: "published", hero: original } });
  await request.delete(`/api/media/${videoId}`, { headers });
  users("delete");
});

const slides = (seconds: number) => images.map((image) => ({ image, seconds }));

test("rejects an image as the video, an empty slideshow, and more than six images", async ({ request }) => {
  expect((await saveHero(request, { background: "video", video: images[0] })).status()).toBe(400);
  expect((await saveHero(request, { background: "images", slides: [] })).status()).toBe(400);
  const seven = Array.from({ length: 7 }, (_, i) => ({ image: images[i % 2], seconds: 5 }));
  expect((await saveHero(request, { background: "images", slides: seven })).status()).toBe(400);
  expect((await saveHero(request, { background: "images", slides: [{ image: videoId, seconds: 5 }] })).status()).toBe(400);
});

test("uses the built-in video when none is uploaded; it can be paused", async ({ page, request }) => {
  expect((await saveHero(request, { background: "video", video: null })).ok()).toBe(true);
  await page.goto("/");
  const video = page.locator("video");
  await expect(video).toHaveAttribute("poster", "/hero/decoration-poster.jpg");
  await page.getByRole("button", { name: "Pause background video" }).click();
  await expect(page.getByRole("button", { name: "Play background video" })).toBeVisible();
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test("plays the uploaded video", async ({ page, request }) => {
  expect((await saveHero(request, { background: "video", video: videoId })).ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator("video source")).toHaveAttribute("src", /\/api\/media\/file\/e2e-hero.*\.mp4/);
  await expect(page.getByRole("button", { name: "Pause background video" })).toBeVisible();
});

/** The hero image currently shown (the last visible layer). */
const shownImage = (page: Page) =>
  page.locator("[data-hero-slide=shown] img").last();

for (const transition of ["fade", "zoom", "slide"] as const) {
  test(`advances images with the ${transition} transition and pauses`, async ({ page, request }) => {
    const saved = await saveHero(request, { background: "images", slides: slides(2), transition });
    expect(saved.ok()).toBe(true);
    await page.goto("/");
    await expect(page.locator("video")).toHaveCount(0);
    const first = await shownImage(page).getAttribute("src");
    await expect.poll(() => shownImage(page).getAttribute("src"), { timeout: 5_000 }).not.toBe(first);
    const name = transition === "slide" ? "hero-slide" : "hero-fade";
    await expect(shownImage(page).locator("..")).toHaveAttribute("style", new RegExp(name));
    // Only animations whose keyframes exist in the CSS are listed (catches stale CSS).
    const running = await shownImage(page).locator("..").evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName));
    expect(running).toContain(name);

    await page.getByRole("button", { name: "Pause background slideshow" }).click();
    const paused = await shownImage(page).getAttribute("src");
    await page.waitForTimeout(3_000);
    expect(await shownImage(page).getAttribute("src")).toBe(paused);
  });
}

test("starts paused when the visitor prefers reduced motion", async ({ page, request }) => {
  expect((await saveHero(request, { background: "images", slides: slides(2), transition: "fade" })).ok()).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Play background slideshow" })).toBeVisible();
  const first = await shownImage(page).getAttribute("src");
  await page.waitForTimeout(3_000);
  expect(await shownImage(page).getAttribute("src")).toBe(first);
});

test("rejects a transition time out of range or not shorter than every display time, and a mask over 100%", async ({ request }) => {
  const images6 = { background: "images", slides: [{ image: images[0], seconds: 6 }, { image: images[1], seconds: 3 }] };
  expect((await saveHero(request, { ...images6, transitionSeconds: 0.1 })).status()).toBe(400);
  expect((await saveHero(request, { ...images6, transitionSeconds: 3 })).status()).toBe(400);
  expect((await saveHero(request, { ...images6, overlayOpacity: 150 })).status()).toBe(400);
  expect((await saveHero(request, { ...images6, transitionSeconds: 2.5, overlayOpacity: 0 })).ok()).toBe(true);
});

test("applies the mask opacity and transition time", async ({ page, request }) => {
  const saved = await saveHero(request, {
    background: "images",
    slides: slides(3),
    transition: "fade",
    transitionSeconds: 2,
    overlayOpacity: 40,
  });
  expect(saved.ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator("[data-hero-overlay]")).toHaveCSS("opacity", "0.4");
  const first = await shownImage(page).getAttribute("src");
  await expect.poll(() => shownImage(page).getAttribute("src"), { timeout: 5_000 }).not.toBe(first);
  await expect(shownImage(page).locator("..")).toHaveCSS("animation-duration", "2s");
});
