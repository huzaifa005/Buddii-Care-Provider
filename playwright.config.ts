import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.E2E_PORT ?? 3100)

/**
 * End-to-end tests run against the dev server with API mocking on, in the locally installed
 * Microsoft Edge (no browser download needed). CI can switch `channel` to "chrome" or drop it
 * after `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A dev server compiles routes on first hit; more workers make cold runs time out.
  workers: process.env.CI ? undefined : 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-GB",
    timezoneId: "Europe/London",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
      testIgnore: /mobile.spec.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "msedge" },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_API_MOCKING: "enabled", NEXT_PUBLIC_API_URL: "/api/v1" },
  },
})
