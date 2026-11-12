import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "categories";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const TITLES = ["e2e Category 1", "e2e Category 2", "e2e Category 3", "e2e Category 4"];

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

let headers: Record<string, string>;
const created: { id: number; slug: string }[] = [];

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
  // Sorted last, so at least 5 tags exist and the last ones start out of view.
  for (const title of TITLES) {
    const response = await request.post("/api/categories", { headers, data: { title, sortOrder: 9999 } });
    expect(response.ok()).toBe(true);
    created.push(((await response.json()) as { doc: { id: number; slug: string } }).doc);
  }
});

test.afterAll(async ({ request }) => {
  for (const { id } of created) await request.delete(`/api/categories/${id}`, { headers });
  users("delete");
});

const list = (page: Page) => page.getByRole("list", { name: "Categories" });

test("category tags show 4 across and scroll with the arrows", async ({ page }) => {
  await page.goto("/products");
  const tags = list(page).getByRole("listitem");
  expect(await tags.count()).toBeGreaterThan(4);

  const listBox = (await list(page).boundingBox())!;
  const visible = async () => {
    let count = 0;
    for (const box of await Promise.all((await tags.all()).map((tag) => tag.boundingBox()))) {
      if (box && box.x >= listBox.x - 1 && box.x + box.width <= listBox.x + listBox.width + 1) count++;
    }
    return count;
  };
  expect(await visible()).toBe(4);

  const previous = page.getByRole("button", { name: "Previous categories" });
  const next = page.getByRole("button", { name: "Next categories" });
  await expect(previous).toBeDisabled();
  const last = list(page).getByRole("link", { name: TITLES.at(-1) });
  await expect(last).not.toBeInViewport({ ratio: 1 });

  // Each click scrolls by one row of 4 tags; with up to 8 tags, one click reaches the end.
  await next.click();
  await expect(previous).toBeEnabled();
  await expect(last).toBeInViewport({ ratio: 1 });
  await expect(next).toBeDisabled();
});

test("the selected category is scrolled into view on load", async ({ page }) => {
  await page.goto(`/products?category=${created.at(-1)!.slug}`);
  const link = list(page).getByRole("link", { name: TITLES.at(-1) });
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect(link).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Next categories" })).toBeDisabled();
});
