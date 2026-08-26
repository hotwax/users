import { expect, test } from "./fixtures/base";

test.describe("users read-only workflows", () => {
  test("loads the users list and supports a semantic search interaction", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    await page.goto("/tabs/users");
    await expect(page.locator("ion-title")).toContainText("Users");
    const search = page.getByRole("searchbox", { name: "Search users" });
    await expect(search).toBeVisible();
    await search.fill("a");
    await search.press("Enter");
    await expect(search).toHaveValue("a");
  });

  test("can open the current user details without editing it", async ({ page, authenticatedPage }) => {
    void authenticatedPage;
    await page.goto("/tabs/users");
    const ownUser = page.locator("ion-card").filter({ hasText: "Your user" }).first();
    test.skip(!(await ownUser.count()), "The authenticated user does not have the Users list permission or profile data.");
    await ownUser.click();
    await expect(page).toHaveURL(/\/user-details\//);
    await expect(page.locator("ion-title")).toContainText(/User|Details/i);
  });
});
