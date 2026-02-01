import { Page } from "@playwright/test";

/**
 * Login as admin user for testing authenticated pages
 *
 * Uses credentials from environment variables:
 * - TEST_ADMIN_EMAIL
 * - TEST_ADMIN_PASSWORD
 *
 * Falls back to test credentials if not set.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");

  const email = process.env.TEST_ADMIN_EMAIL || "test@example.com";
  const password = process.env.TEST_ADMIN_PASSWORD || "testpassword";

  // Wait for form to be ready
  await page.waitForSelector('input[type="email"]', { state: "visible" });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to dashboard with longer timeout
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
}

/**
 * Wait for page loading skeleton to disappear
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for any skeleton/loading indicators to disappear
  const skeleton = page.locator(".animate-pulse").first();
  if ((await skeleton.count()) > 0) {
    await skeleton.waitFor({ state: "hidden", timeout: 15000 });
  }
}

/**
 * Navigate to admin page and wait for it to load
 */
export async function navigateToAdminPage(
  page: Page,
  path: string
): Promise<void> {
  await page.goto(`/admin${path}`);
  await page.waitForLoadState("networkidle");
  await waitForLoadingComplete(page);
}
