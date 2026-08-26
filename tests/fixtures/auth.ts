import { type Page, expect } from "@playwright/test";

export type AuthConfig = {
  username: string;
  password: string;
  oms?: string;
};

export function getAuthConfig(): AuthConfig | undefined {
  const username = process.env.PLAYWRIGHT_USERNAME;
  const password = process.env.PLAYWRIGHT_PASSWORD;
  if(!username || !password) {return undefined;}

  return { username, password, oms: process.env.PLAYWRIGHT_OMS };
}

export function requireAuthConfig(): AuthConfig {
  const config = getAuthConfig();
  if(!config) {
    throw new Error("Authenticated acceptance tests require PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD. " +
        "Set them only in the shell/CI secret store; do not commit credentials.",);
  }

  return config;
}

export async function login(page: Page, config = requireAuthConfig()): Promise<void> {
  await page.goto("/login");

  if(config.oms) {
    const omsChip = page.locator("ion-chip").filter({ hasText: /.+/ }).first();
    if(await omsChip.isVisible().catch(() => false)) {
      await omsChip.click();
      await page.locator("#instanceUrl").fill(config.oms);
      await page.getByRole("button", { name: "Next" }).click();
    }
  }

  await page.locator("#username").fill(config.username);
  await page.locator("#password").fill(config.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}
