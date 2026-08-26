import { expect, test } from "./fixtures/base";

test.describe("authorization flow inventory", () => {
  test("authorization route is protected", async ({ page }) => {
    await page.goto("/tabs/manage-authorization");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });

  test("artifact authorization mutation is held until isolated fixture cleanup is configured", async () => {
    test.skip(true, "Requires a disposable native group/artifact authorization and guaranteed cleanup.");
  });
});
