import { expect, test } from "./fixtures/base";

test.describe("authenticated navigation", () => {
  test("settings is reachable and exposes the safe logout control", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    await page.goto("/tabs/settings");
    await expect(page.locator("ion-title")).toContainText("Settings");
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("permission surfaces remain directly addressable for authorized users", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    for(const route of ["/tabs/app-permissions", "/tabs/manage-authorization"]) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      await expect(page.locator("ion-router-outlet")).toBeVisible();
    }
  });
});
