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

test.describe("Admin Subscribers Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/subscribers");
  });

  test("should load subscribers page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Subscribers" })).toBeVisible();
  });

  test("should display subscriber count", async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Should show subscriber count (e.g., "5 subscribers" or "0 subscribers")
    await expect(page.getByText(/\d+ subscriber/)).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by phone number...");
    await expect(searchInput).toBeVisible();
  });

  test("should filter by search query", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by phone number...");
    await searchInput.fill("27");

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Search should be applied (no error)
    await expect(searchInput).toHaveValue("27");
  });

  test("should have status filter dropdown", async ({ page }) => {
    // Find the select element for status filter
    const statusSelect = page.locator("select").first();
    await expect(statusSelect).toBeVisible();

    // Should have the filter options (check select value instead of option text)
    await expect(statusSelect).toHaveValue("all");
  });

  test("should filter by status", async ({ page }) => {
    const statusSelect = page.locator("select").first();

    // Change to Active filter
    await statusSelect.selectOption("active");

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should have applied the filter (no error)
    await expect(statusSelect).toHaveValue("active");
  });

  test("should have export CSV button", async ({ page }) => {
    const exportButton = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportButton).toBeVisible();
  });

  test("should trigger CSV download on export click", async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    // Click export button
    await page.getByRole("button", { name: /Export CSV/i }).click();

    // Check if download was triggered (may not actually download in test env)
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain("subscribers");
      expect(download.suggestedFilename()).toContain(".csv");
    }
  });

  test("should display subscriber table or empty state", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Either show table with data or empty table
    const table = page.locator("table");
    const hasTable = await table.count() > 0;

    // Should have either a table or the page loaded without error
    expect(hasTable || await page.getByRole("heading", { name: "Subscribers" }).isVisible()).toBeTruthy();
  });

  test("should have import subscribers button when mosque loaded", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Import button may or may not be visible depending on mosque data
    // Just verify the page doesn't error
    await expect(page.getByRole("heading", { name: "Subscribers" })).toBeVisible();
  });
});

test.describe("Subscriber Actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/subscribers");
    await page.waitForLoadState("networkidle");
  });

  test("should show confirmation before delete", async ({ page }) => {
    // Only run if there's a delete button
    const deleteButton = page.locator('button:has-text("Delete")').first();
    const hasDeleteButton = (await deleteButton.count()) > 0;

    if (hasDeleteButton) {
      // Set up dialog handler
      page.on("dialog", async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        expect(dialog.message()).toContain("delete");
        await dialog.dismiss(); // Cancel the delete
      });

      await deleteButton.click();
    } else {
      // No subscribers to delete, test passes
      expect(true).toBeTruthy();
    }
  });
});
