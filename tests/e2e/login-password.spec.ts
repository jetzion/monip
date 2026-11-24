import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test } from "@playwright/test";

// Its own account: other specs that need admins may run in parallel workers.
const USER_SET = "login";
const ADMIN = `e2e-${USER_SET}-admin@example.com`;
const PASSWORD = randomBytes(12).toString("hex");

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], {
    stdio: "pipe",
    env: { ...process.env, E2E_USER_SET: USER_SET },
  });

test.beforeAll(() => {
  users("create", PASSWORD);
});

test.afterAll(() => {
  users("delete");
});

test("the eye button shows the password while typing, hides it again, and sign-in still works", async ({ page }) => {
  await page.goto("/admin/login");
  const password = page.locator("#field-password");
  const eye = page.getByRole("button", { name: "Show password" });

  await expect(password).toHaveAttribute("type", "password");
  await expect(eye).toHaveAttribute("aria-pressed", "false");

  await eye.click();
  await expect(eye).toHaveAttribute("aria-pressed", "true");
  // Typing re-renders the field; the password must stay visible.
  await password.pressSequentially(PASSWORD);
  await expect(password).toHaveAttribute("type", "text");

  await eye.click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(eye).toHaveAttribute("aria-pressed", "false");

  // After a click, typing continues at the end of the password.
  await eye.click();
  await expect(password).toBeFocused();
  await page.keyboard.type("x");
  await expect(password).toHaveValue(`${PASSWORD}x`);
  await page.keyboard.press("Backspace");

  // A keyboard press keeps focus on the button.
  await eye.focus();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "password");
  await expect(eye).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "text");

  await page.fill("#field-email", ADMIN);
  await expect(password).toHaveValue(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
});
