import { expect, test } from "@playwright/test";

const PRODUCT = "/products/placeholder-product-1";
const PRODUCT_FORM = "/contact?product=placeholder-product-1";

test("shows field errors and keeps typed values", async ({ page }) => {
  await page.goto(PRODUCT_FORM);
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

test("an unknown product falls back to a general inquiry", async ({ page }) => {
  await page.goto("/contact?product=no-such-product");
  await expect(page.getByText("Product:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
});

test("visitor submits a product inquiry", async ({ page }) => {
  await page.goto(PRODUCT);
  const name = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
  await expect(page.getByLabel("Message")).toHaveCount(0);
  await page.getByRole("link", { name: "Product inquiry" }).click();

  await expect(page).toHaveURL(PRODUCT_FORM);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discuss a project");
  await expect(page.getByText(`Product: ${name}`)).toBeVisible();
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("e2e-visitor@example.com");
  await page.getByLabel("Message").fill("E2E test inquiry: 500 units, please.");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  const dialog = page.getByRole("dialog", { name: "Inquiry sent" });
  await expect(dialog.getByRole("status")).toContainText(`We received your inquiry about ${name}`);
  await expect(page).toHaveURL("/", { timeout: 15_000 });
});

test("the sent popup returns home early when dismissed", async ({ page }) => {
  await page.goto(PRODUCT_FORM);
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill("e2e-visitor@example.com");
  await page.getByLabel("Message").fill("E2E test inquiry: dismiss the popup.");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await page.getByRole("button", { name: "Go to home page" }).click();
  await expect(page).toHaveURL("/");
});

test("formats the phone number while typing", async ({ page }) => {
  await page.goto(PRODUCT_FORM);
  const phone = page.getByLabel("Phone (optional)");
  await phone.pressSequentially("5550100199");
  await expect(phone).toHaveValue("(555) 010-0199");
  await phone.pressSequentially("12345");
  await expect(phone).toHaveValue("(555) 010-0199 ext:12345");
});

test("checks the email address when leaving the field", async ({ page }) => {
  await page.goto(PRODUCT_FORM);
  const email = page.getByLabel("Email");
  await email.fill("name@company");
  await email.blur();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await email.fill("name@company.com");
  await email.blur();
  await expect(page.getByText("Enter a valid email address")).toBeHidden();
});

test("honeypot submissions show success but are not saved", async ({ page }) => {
  await page.goto(PRODUCT_FORM);
  await page.getByLabel("Name").fill("Honeypot Bot");
  await page.getByLabel("Email").fill("bot@example.com");
  await page.getByLabel("Message").fill("Spam message from a bot.");
  await page.locator('input[name="website"]').fill("https://spam.example");
  await page.getByRole("button", { name: "Send inquiry" }).click();

  await expect(page.getByRole("status")).toContainText("We received your inquiry");
});
