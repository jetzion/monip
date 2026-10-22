import { defineConfig } from "@playwright/test";

const PORT = 3100;

/** E2E tests run against a dev server and the local Docker database. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
  },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}/products`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
