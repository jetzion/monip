import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * E2E tests run against a production build and the local Docker database.
 * A production server can run alongside a developer's `pnpm dev`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
  },
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/products`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
