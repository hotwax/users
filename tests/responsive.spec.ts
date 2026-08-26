import { expect, test } from "./fixtures/base";

test.describe("responsive and dismissal behavior", () => {
  test("login remains usable at mobile and desktop widths", async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await expect(page.locator("#username")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
    }
  });

  test("browser back navigation preserves the unauthenticated boundary", async ({ page }) => {
    await page.goto("/login");
    await page.goto("/tabs/settings");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });
});
