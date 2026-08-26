import { getAuthConfig, login } from "./fixtures/auth";
import { expect, test } from "./fixtures/base";

test.describe("login boundary", () => {
  test("unauthenticated users are given the login form", async ({ page }) => {
    await page.goto("/tabs/settings");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("valid credentials can enter the app without changing account data", async ({ page }) => {
    test.skip(!getAuthConfig(), "Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run the live login flow.");
    await login(page);
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  });
});
