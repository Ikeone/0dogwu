import { defineConfig, devices } from "@playwright/test";

// End-to-end tests assume the app is already running (or start it via webServer).
// In CI/cloud environments without browsers installed, `pnpm test:e2e` is a
// best-effort step; see docs/TEST_REPORT.md for what actually ran.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.APP_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: process.env.APP_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
