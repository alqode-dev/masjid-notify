import { test, expect, Page } from "@playwright/test";

// Helper to login before testing authenticated pages
async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");

  // Fill credentials from environment or use test credentials
  const email = process.env.TEST_ADMIN_EMAIL || "test@example.com";
  const password = process.env.TEST_ADMIN_PASSWORD || "testpassword";

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
}

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load dashboard without infinite loading", async ({ page }) => {
    await page.goto("/admin");

    // Should not show loading skeleton after data loads
    await expect(page.locator(".animate-pulse").first()).toBeHidden({
      timeout: 10000,
    });

    // Dashboard should have loaded content
    await expect(page.getByText("Dashboard Overview")).toBeVisible();
  });

  test("should display mosque name", async ({ page }) => {
    await page.goto("/admin");

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Should show mosque name (h1 element)
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    // Mosque name should not be empty
    const text = await heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test("should display statistics cards", async ({ page }) => {
    await page.goto("/admin");

    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Check all 4 stat cards are visible
    await expect(page.getByText("Total Subscribers")).toBeVisible();
    await expect(page.getByText("Active Subscribers")).toBeVisible();
    await expect(page.getByText("Total Messages Sent")).toBeVisible();
    await expect(page.getByText("Messages Today")).toBeVisible();
  });

  test("should display quick action cards", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Check quick actions section
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByRole("link", { name: /Send Announcement/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Subscribers/i })).toBeVisible();
  });

  test("should navigate to announcements via quick action", async ({ page }) => {
    await page.goto("/admin");

    await page.click('a:has-text("Send Announcement")');
    await expect(page).toHaveURL("/admin/announcements");
  });

  test("should navigate to subscribers via quick action", async ({ page }) => {
    await page.goto("/admin");

    await page.click('a:has-text("View Subscribers")');
    await expect(page).toHaveURL("/admin/subscribers");
  });

  test("should navigate to settings via quick action", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Click settings in the quick actions area
    await page.locator('a[href="/admin/settings"]').last().click();
    await expect(page).toHaveURL("/admin/settings");
  });

  test("should display analytics section", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText("Analytics")).toBeVisible();
  });
});
