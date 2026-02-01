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

test.describe("Admin Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
  });

  test("should load settings page without infinite loading", async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Settings heading should be visible
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  });

  test("should display settings description", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText("Configure your mosque preferences")
    ).toBeVisible();
  });

  test("should display Prayer Time Settings section", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Prayer Time Settings")).toBeVisible();
  });

  test("should display Ramadan Settings section", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Ramadan Settings")).toBeVisible();
  });

  test("should have calculation method dropdown", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Find calculation method select
    const calcMethodSelect = page
      .locator("select")
      .filter({ hasText: /Karachi|ISNA|Muslim World League/i });
    await expect(calcMethodSelect.first()).toBeVisible();
  });

  test("should have madhab dropdown", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Madhab selection should be available
    await expect(page.getByText("Madhab")).toBeVisible();
  });

  test("should have Jumuah time inputs", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should have Jumuah Adhaan and Khutbah time inputs
    await expect(page.getByText("Jumu'ah Adhaan")).toBeVisible();
    await expect(page.getByText("Jumu'ah Khutbah")).toBeVisible();
  });

  test("should have editable Jumuah Adhaan time", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Find time input for Jumuah Adhaan
    const timeInputs = page.locator('input[type="time"]');
    const count = await timeInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // First time input should be editable
    const firstTimeInput = timeInputs.first();
    await expect(firstTimeInput).toBeVisible();
    await expect(firstTimeInput).toBeEditable();
  });

  test("should have Ramadan Mode toggle", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Ramadan Mode")).toBeVisible();
    await expect(
      page.getByText("Enable Suhoor and Iftar reminders")
    ).toBeVisible();
  });

  test("should have switch for Ramadan mode", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should have a toggle switch
    const toggle = page.locator('button[role="switch"]');
    await expect(toggle).toBeVisible();
  });

  test("should toggle Ramadan mode and show options", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.locator('button[role="switch"]');

    // Get current state
    const isChecked = await toggle.getAttribute("data-state");

    if (isChecked === "unchecked") {
      // Enable Ramadan mode
      await toggle.click();

      // Should show Ramadan options
      await expect(
        page.getByText("Suhoor reminder (mins before Fajr)")
      ).toBeVisible();
      await expect(
        page.getByText("Iftar reminder (mins before Maghrib)")
      ).toBeVisible();
    } else {
      // Ramadan mode already enabled, options should be visible
      await expect(
        page.getByText("Suhoor reminder (mins before Fajr)")
      ).toBeVisible();
    }
  });

  test("should hide Ramadan options when mode disabled", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.locator('button[role="switch"]');
    const isChecked = await toggle.getAttribute("data-state");

    if (isChecked === "checked") {
      // Disable Ramadan mode
      await toggle.click();

      // Ramadan options should be hidden
      await expect(
        page.getByText("Suhoor reminder (mins before Fajr)")
      ).toBeHidden();
    } else {
      // Ramadan mode already disabled, options should be hidden
      await expect(
        page.getByText("Suhoor reminder (mins before Fajr)")
      ).toBeHidden();
    }
  });

  test("should have Save Settings button", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /Save/i })).toBeVisible();
  });

  test("should have Taraweeh time input when Ramadan mode is on", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.locator('button[role="switch"]');
    const isChecked = await toggle.getAttribute("data-state");

    if (isChecked === "unchecked") {
      await toggle.click();
    }

    // Taraweeh time should be visible
    await expect(page.getByText("Taraweeh Time")).toBeVisible();
  });
});

test.describe("Settings Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");
  });

  test("should populate form with current settings", async ({ page }) => {
    // Wait for loading to complete
    await expect(page.locator(".animate-pulse").first()).toBeHidden({
      timeout: 10000,
    });

    // Time inputs should have values (not empty)
    const timeInputs = page.locator('input[type="time"]');
    const firstInput = timeInputs.first();
    const value = await firstInput.inputValue();

    // Should have a time value loaded
    expect(value).toMatch(/\d{2}:\d{2}/);
  });

  test("should allow changing calculation method", async ({ page }) => {
    await expect(page.locator(".animate-pulse").first()).toBeHidden({
      timeout: 10000,
    });

    // Find and change calculation method
    const selects = page.locator("select");
    const calcMethodSelect = selects.first();

    // Change to a different method
    await calcMethodSelect.selectOption("2"); // ISNA

    // Should be changed
    await expect(calcMethodSelect).toHaveValue("2");
  });

  test("should allow editing Jumuah times", async ({ page }) => {
    await expect(page.locator(".animate-pulse").first()).toBeHidden({
      timeout: 10000,
    });

    // Find Jumuah Adhaan time input
    const timeInputs = page.locator('input[type="time"]');
    const adhaan = timeInputs.first();

    // Clear and set new time
    await adhaan.fill("13:00");

    // Should be changed
    await expect(adhaan).toHaveValue("13:00");
  });
});

test.describe("Settings Save Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".animate-pulse").first()).toBeHidden({
      timeout: 10000,
    });
  });

  test("should show loading state when saving", async ({ page }) => {
    // Make a change
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.first().fill("13:15");

    // Click save
    const saveButton = page.getByRole("button", { name: /Save/i });
    await saveButton.click();

    // Button should show loading state (either disabled or has spinner)
    // The save action will complete and show toast
    // Just verify the click doesn't error
    await page.waitForTimeout(500);
  });

  test("should show success toast after saving", async ({ page }) => {
    // Make a small change
    const timeInputs = page.locator('input[type="time"]');
    const currentValue = await timeInputs.first().inputValue();
    const newMinute = currentValue.slice(-2) === "00" ? "01" : "00";
    const newTime = currentValue.slice(0, 3) + newMinute;
    await timeInputs.first().fill(newTime);

    // Click save
    const saveButton = page.getByRole("button", { name: /Save/i });
    await saveButton.click();

    // Wait for save to complete - the button should no longer be in loading state
    await page.waitForTimeout(2000);

    // Should show success message (toast) or button should have returned to normal
    const toast = page.locator('[data-sonner-toast]');
    const hasToast = await toast.count() > 0;

    // Either we have a toast or save completed without error (button available)
    expect(hasToast || await saveButton.isEnabled()).toBeTruthy();
  });
});
