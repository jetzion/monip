import { expect, test } from "@playwright/test";

test("AI description endpoint requires an admin login", async ({ request }) => {
  const response = await request.post("/api/products/describe", { data: { name: "Mug", imageIds: [] } });
  expect(response.status()).toBe(401);
});
