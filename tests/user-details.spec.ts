import { expect, test } from "./fixtures/base";

test.describe("user details flow inventory", () => {
  test("account and party-only detail routes are protected", async ({ page }) => {
    for (const route of ["/user-details/unknown-user", "/user-details/party/unknown-party"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
    }
  });

  test("credential-changing actions are contract-only until a disposable fixture is configured", async () => {
    test.skip(true, "Requires PLAYWRIGHT_DISPOSABLE_FIXTURE_ID and isolated credential/email sinks; never use hotwax.user.");
  });
});
