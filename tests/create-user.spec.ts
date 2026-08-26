import { expect, test } from "./fixtures/base";

test.describe("user creation flow inventory", () => {
  test("create, quick-setup, and confirmation routes are protected", async ({ page }) => {
    for (const route of ["/create-user", "/user-quick-setup/unknown-party", "/user-confirmation/unknown-party"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
    }
  });

  test("disposable user creation mutation is held until isolated fixture cleanup is configured", async () => {
    test.skip(true, "Requires a unique disposable MySQL fixture and guaranteed cleanup; no protected account mutation.");
  });
});
