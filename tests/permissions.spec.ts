import { expect, test } from "./fixtures/base";

test.describe("permission and authorization read-only surfaces", () => {
  test("renders app permissions when the account is authorized", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    await page.goto("/tabs/app-permissions");
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator("ion-title, ion-card-title").first()).toBeVisible();
  });

  test("renders manage authorization when the account is authorized", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    await page.goto("/tabs/manage-authorization");
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator("ion-title, ion-label").first()).toBeVisible();
  });
});
