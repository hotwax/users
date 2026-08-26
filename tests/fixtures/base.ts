import { test as base, expect } from "@playwright/test";
import { getAuthConfig, login } from "./auth";

type Fixtures = {
  authenticatedPage: void;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use, testInfo) => {
    const legacyRequests: string[] = [];
    const pageErrors: string[] = [];
    page.on("request", request => {
      if (request.url().includes("/api/")) legacyRequests.push(request.url());
    });
    page.on("pageerror", error => pageErrors.push(error.message));
    await use(page);
    expect(legacyRequests, "Users app must not issue legacy /api/ requests").toEqual([]);
    expect(pageErrors, "Browser page errors must be empty").toEqual([]);
    if (testInfo.status !== testInfo.expectedStatus) {
      testInfo.attach("legacy-request-audit", { body: JSON.stringify(legacyRequests), contentType: "application/json" });
    }
  },
  authenticatedPage: async ({ page }, use, testInfo) => {
    const config = getAuthConfig();
    testInfo.skip(!config, "Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run authenticated acceptance flows.");
    await login(page, config);
    await use();
  },
});

export { expect };
