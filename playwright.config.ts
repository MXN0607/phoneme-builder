import { defineConfig, devices } from "@playwright/test";

// Run with: npx playwright test
// (first run: npx playwright install chromium — downloads the browser)
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Starts `npm run dev` automatically before the tests run, and reuses an
  // already-running server instead of starting a second one — so these
  // tests work whether or not the app happens to already be up.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
