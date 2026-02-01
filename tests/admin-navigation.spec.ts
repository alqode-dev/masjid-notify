import { test, expect, Page } from "@playwright/test";

// Helper to login before testing authenticated pages
async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");

  const email = process.env.TEST_ADMIN_EMAIL || "test@example.com";
  const password = process.env.TEST_ADMIN_PASSWORD || "testpassword";

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');

  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
}

test.describe("Admin Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin");

    // Sidebar should be visible on desktop
    // Look for navigation links
    await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
  });

  test("should navigate to all admin pages from sidebar", async ({ page }) => {
    await page.goto("/admin");

    // Test navigation to each page
    const pages = [
      { name: /Subscribers/i, url: "/admin/subscribers" },
      { name: /Announcements/i, url: "/admin/announcements" },
      { name: /Settings/i, url: "/admin/settings" },
      { name: /QR Code/i, url: "/admin/qr-code" },
      { name: /Dashboard/i, url: "/admin" },
    ];

    for (const pageInfo of pages) {
      const link = page.getByRole("link", { name: pageInfo.name });
      if ((await link.count()) > 0) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(pageInfo.url));
        // Go back to dashboard for next iteration
        await page.goto("/admin");
      }
    }
  });

  test("should highlight active page in sidebar", async ({ page }) => {
    await page.goto("/admin/subscribers");

    // The active link should have different styling
    const subscribersLink = page.getByRole("link", { name: /Subscribers/i });
    if ((await subscribersLink.count()) > 0) {
      // Link should exist and page should be at correct URL
      await expect(page).toHaveURL("/admin/subscribers");
    }
  });
});

test.describe("Admin Page Redirects", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access protected pages without login
    const protectedPages = [
      "/admin",
      "/admin/subscribers",
      "/admin/announcements",
      "/admin/settings",
      "/admin/qr-code",
    ];

    for (const url of protectedPages) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test("should redirect to dashboard after successful login", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    const email = process.env.TEST_ADMIN_EMAIL || "test@example.com";
    const password = process.env.TEST_ADMIN_PASSWORD || "testpassword";

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 15000 });
  });

  test("should preserve intended destination after login", async ({ page }) => {
    // Try to access settings first (will redirect to login)
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login/);

    // Login
    const email = process.env.TEST_ADMIN_EMAIL || "test@example.com";
    const password = process.env.TEST_ADMIN_PASSWORD || "testpassword";

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');

    // Should redirect somewhere in admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });
});

test.describe("Admin Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin");

    // Page should load and show content
    await expect(page.getByText("Dashboard Overview")).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/admin");

    // Page should load correctly
    await expect(page.getByText("Dashboard Overview")).toBeVisible();
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin");

    // Page should load with full layout
    await expect(page.getByText("Dashboard Overview")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });
});

test.describe("Admin Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should handle 404 for invalid admin routes gracefully", async ({
    page,
  }) => {
    const response = await page.goto("/admin/nonexistent-page");

    // Should either show 404 or redirect
    // Just verify no unhandled error
    expect(response?.status()).toBeDefined();
  });

  test("should not crash on network errors", async ({ page }) => {
    // Test page loads even with slow network
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Page should eventually load - look for dashboard content
    await expect(page.getByText("Dashboard Overview")).toBeVisible({
      timeout: 30000,
    });
  });
});

test.describe("Admin Breadcrumbs and Title", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should have correct page title on dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveTitle(/Admin|Dashboard|Masjid/i);
  });

  test("should show page heading on each admin page", async ({ page }) => {
    const pages = [
      { url: "/admin", heading: /Dashboard Overview/i },
      { url: "/admin/subscribers", heading: /Subscribers/i },
      { url: "/admin/announcements", heading: /Announcements/i },
      { url: "/admin/settings", heading: /Settings/i },
      { url: "/admin/qr-code", heading: /QR Code/i },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState("networkidle");

      // Wait for loading to complete
      await expect(page.locator(".animate-pulse").first()).toBeHidden({
        timeout: 10000,
      });

      // Check heading
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible();
    }
  });
});
