import { expect, test } from "@playwright/test";

const PRODUCT = "/products/placeholder-product-1";

test("shows field errors and keeps typed values", async ({ page }) => {
  await page.goto(PRODUCT);
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Check the highlighted fields." }),
  ).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Name")).toHaveValue("E2E Visitor");
});

test("visitor submits a product inquiry", async ({ page }) => {
  await page.goto(PRODUCT);
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("e2e-visitor@example.com");
  await page.getByLabel("Message").fill("E2E test inquiry: 500 units, please.");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(page.getByRole("status")).toContainText(
    "We received your inquiry about Placeholder Product 1",
  );
});

test("honeypot submissions show success but are not saved", async ({ page }) => {
  await page.goto(PRODUCT);
  await page.getByLabel("Name").fill("Honeypot Bot");
  await page.getByLabel("Email").fill("bot@example.com");
  await page.getByLabel("Message").fill("Spam message from a bot.");
  await page.locator('input[name="website"]').fill("https://spam.example");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(page.getByRole("status")).toContainText("We received your inquiry");
});
