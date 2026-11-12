import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test, type APIRequestContext } from "@playwright/test";

// Its own accounts: other specs that need admins may run in parallel workers.
const USER_SET = "alt";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");
const JPEG = readFileSync("public/hero/decoration-poster.jpg");

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

let headers: Record<string, string>;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  users("create", PASSWORD);
  const login = await request.post("/api/users/login", { data: { email: ADMIN, password: PASSWORD } });
  headers = { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
});

test.afterAll(async ({ request }) => {
  await request.delete("/api/media?where[filename][like]=e2e-alt", { headers });
  users("delete");
});

const altOf = async (request: APIRequestContext, filename: string) => {
  const response = await request.get(`/api/media?where[filename][equals]=${filename}&depth=0`, { headers });
  return ((await response.json()) as { docs: { alt: string }[] }).docs[0]?.alt;
};

test("API uploads without alt text get it from the file name", async ({ request }) => {
  const upload = await request.post("/api/media", {
    headers,
    multipart: {
      _payload: JSON.stringify({}),
      file: { name: "e2e-alt_api-upload.jpg", mimeType: "image/jpeg", buffer: JPEG },
    },
  });
  expect(upload.ok()).toBe(true);
  expect(await altOf(request, "e2e-alt_api-upload.jpg")).toBe("e2e alt api upload");
});

test("the admin form suggests alt text from the file name and keeps the editor's text", async ({ page, request }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/collections/media/create");
  const alt = page.locator("#field-alt");
  const fileInput = page.locator("input[type=file]");
  await fileInput.setInputFiles({ name: "e2e-alt_first (draft).jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(alt).toHaveValue("e2e alt first draft");

  // A different file replaces the untouched suggestion.
  await page.locator(".file-field__remove").click();
  await fileInput.setInputFiles({ name: "e2e-alt_tote-bag.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(alt).toHaveValue("e2e alt tote bag");

  // Text the editor typed is kept when the file changes.
  await alt.fill("Navy tote bag with embroidered logo");
  await page.locator(".file-field__remove").click();
  await fileInput.setInputFiles({ name: "e2e-alt_tote-bag-final.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(alt).toHaveValue("Navy tote bag with embroidered logo");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("successfully")).toBeVisible();
  expect(await altOf(request, "e2e-alt_tote-bag-final.jpg")).toBe("Navy tote bag with embroidered logo");
});
