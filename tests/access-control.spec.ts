import { expect, test } from "./fixtures/base";

test.describe("access control", () => {
  test("protected user routes redirect unauthenticated users", async ({ page }) => {
    await page.goto("/user-details/unknown-user");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });

  test("protected creation and authorization routes redirect unauthenticated users", async ({ page }) => {
    for (const route of ["/create-user", "/create-security-group", "/add-permissions"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
    }
  });
});
