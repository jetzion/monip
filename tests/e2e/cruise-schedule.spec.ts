import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const ADMIN = "e2e-admin@example.com";
const EDITOR = "e2e-editor@example.com";
const PASSWORD = randomBytes(12).toString("hex");
const LIST = "/admin/collections/cruise-sailings";

const users = (...args: string[]) =>
  execFileSync("pnpm", ["-s", "payload", "run", "scripts/e2e-users.ts", ...args], { stdio: "pipe" });

test.describe.configure({ mode: "serial" });
test.beforeAll(() => users("create", PASSWORD));
test.afterAll(() => users("delete"));

const token = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/users/login", { data: { email, password: PASSWORD } });
  return ((await response.json()) as { token: string }).token;
};

/** Number of sailings matching a where query string, from the API. */
const total = async (request: APIRequestContext, jwt: string, where: string) => {
  const response = await request.get(`/api/cruise-sailings?limit=1&depth=0&${where}`, {
    headers: { Authorization: `JWT ${jwt}` },
  });
  return ((await response.json()) as { totalDocs: number }).totalDocs;
};

const logIn = async (page: Page) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin");
  await page.goto(LIST);
  await expect(page.getByRole("group", { name: "Filter sailings" })).toBeVisible();
};

const pick = async (page: Page, label: string, option: string) => {
  await page.getByLabel(label, { exact: true }).fill(option);
  await page.keyboard.press("Enter");
};

const pageInfo = (page: Page) => page.locator(".page-controls__page-info");

test("sailings and the template require an admin", async ({ request }) => {
  expect((await request.get("/api/cruise-sailings")).status()).toBe(403);
  expect((await request.get("/api/cruise-sailings/template")).status()).toBe(401);

  const editor = { Authorization: `JWT ${await token(request, EDITOR)}` };
  expect((await request.get("/api/cruise-sailings", { headers: editor })).status()).toBe(403);
  expect((await request.get("/api/cruise-sailings/template", { headers: editor })).status()).toBe(403);
});

test("filters combine with AND and clear together", async ({ page, request }) => {
  const jwt = await token(request, ADMIN);
  const all = await total(request, jwt, "");
  const miami = await total(request, jwt, "where[startPort][equals]=Miami, Florida");
  const miamiJanuary = await total(
    request,
    jwt,
    "where[and][0][startPort][equals]=Miami, Florida&where[and][1][startDate][greater_than_equal]=2026-01-01T00:00:00.000Z&where[and][2][startDate][less_than]=2026-02-01T00:00:00.000Z",
  );

  await logIn(page);
  await expect(pageInfo(page)).toHaveText(new RegExp(`of ${all}$`));
  await pick(page, "Port", "Miami, Florida");
  await expect(pageInfo(page)).toHaveText(new RegExp(`of ${miami}$`));
  await pick(page, "Month", "January 2026");
  await expect(pageInfo(page)).toHaveText(new RegExp(`of ${miamiJanuary}$`));

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(pageInfo(page)).toHaveText(new RegExp(`of ${all}$`));
});

test("the Ship list narrows to the selected cruise line", async ({ page, request }) => {
  const jwt = await token(request, ADMIN);
  const carnival = await total(request, jwt, "where[cruiseLine][equals]=Carnival");

  await logIn(page);
  await pick(page, "Ship", "Icon of the Seas");
  await pick(page, "Cruise line", "Carnival");
  await expect(pageInfo(page)).toHaveText(new RegExp(`of ${carnival}$`));

  await page.getByLabel("Ship", { exact: true }).click();
  const ships = await page.locator(".rs__option").allInnerTexts();
  expect(ships.length).toBeGreaterThan(0);
  expect(ships).not.toContain("Icon of the Seas");
});

test("a date with no sailings shows the empty state", async ({ page }) => {
  await logIn(page);
  await page.getByLabel("Date", { exact: true }).fill("1 Jan 2099");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "No Results." })).toBeVisible();
});

test("the template downloads with the 13 import headers", async ({ page }) => {
  await logIn(page);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download Excel Template" }).click(),
  ]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());
  const headers = (workbook.getWorksheet("Sailings")?.getRow(1).values as unknown[]).slice(1);
  expect(headers).toEqual([
    "Cruise line",
    "Ship",
    "Operator",
    "Start date",
    "End date",
    "Nights",
    "Start port",
    "End port",
    "Ports in order",
    "Confidence",
    "Source",
    "Arrival",
    "Departure",
  ]);
});
