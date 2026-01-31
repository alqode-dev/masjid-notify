import { test, expect } from "@playwright/test";

test.describe("Subscription Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display landing page with mosque info", async ({ page }) => {
    // Check for mosque name
    await expect(page.getByText("Test Masjid")).toBeVisible();

    // Check for prayer times section
    await expect(page.getByText("Today's Prayer Times")).toBeVisible();

    // Check for subscribe form
    await expect(page.getByText("Stay Connected")).toBeVisible();
  });

  test("should display prayer times", async ({ page }) => {
    // Check for all prayer names
    const prayers = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (const prayer of prayers) {
      await expect(page.getByText(prayer)).toBeVisible();
    }
  });

  test("should validate phone number", async ({ page }) => {
    // Try to submit with empty phone
    await page.click('button:has-text("Subscribe via WhatsApp")');
    await expect(page.getByText("Phone number is required")).toBeVisible();

    // Try invalid phone number
    await page.fill('input[type="tel"]', "123");
    await page.click('button:has-text("Subscribe via WhatsApp")');
    await expect(
      page.getByText("Please enter a valid South African phone number")
    ).toBeVisible();
  });

  test("should show preferences checkboxes", async ({ page }) => {
    // Check all preference options are visible
    const preferences = [
      "Fajr reminders",
      "All 5 daily prayers",
      "Jumu'ah reminder",
      "Program announcements",
      "Daily hadith",
      "Ramadan reminders",
    ];

    for (const pref of preferences) {
      await expect(page.getByText(pref)).toBeVisible();
    }
  });

  test("should toggle preferences", async ({ page }) => {
    // Click on "All 5 daily prayers" checkbox
    await page.click('text="All 5 daily prayers"');

    // Verify it was checked (Fajr should also be checked)
    const fajrCheckbox = page.locator('text="Fajr reminders"').locator("..").locator("input");
    await expect(fajrCheckbox).toBeChecked();
  });

  test("should have reminder offset selector", async ({ page }) => {
    await expect(page.getByText("Remind me")).toBeVisible();

    // Should show default 15 minutes
    const select = page.locator("select");
    await expect(select).toHaveValue("15");
  });
});
