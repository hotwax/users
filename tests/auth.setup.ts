import { getAuthConfig, login } from "./fixtures/auth";
import { test } from "./fixtures/base";

test("login credentials reach an authenticated route", async ({ page }) => {
  test.skip(!getAuthConfig(), "Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run the authenticated smoke check.");
  await login(page);
});
