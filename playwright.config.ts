import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.local"), override: true });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8100";
const startServer = process.env.PLAYWRIGHT_START_SERVER === "true";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "output/playwright/report", open: "never" }]],
  outputDir: "output/playwright/test-results",
  webServer: startServer
    ? {
      command: "pnpm dev --host localhost",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL,
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
        headless: process.env.PLAYWRIGHT_HEADED !== "true",
        ignoreHTTPSErrors: true,
        launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
          : undefined,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
        video: "retain-on-failure",
      },
    },
  ],
});
