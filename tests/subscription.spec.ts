import { test, expect } from "@playwright/test";

test.describe("Subscription Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display landing page with mosque info", async ({ page }) => {
    // Check for mosque name (any mosque, not hardcoded)
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();

    // Check for prayer times section
    await expect(page.getByText("Today's Prayer Times")).toBeVisible();

    // Check for subscribe form
    await expect(page.getByText("Stay Connected")).toBeVisible();
  });

  test("should display prayer times", async ({ page }) => {
    // Check for all prayer names (use exact match to avoid duplicates)
    const prayers = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (const prayer of prayers) {
      await expect(page.getByText(prayer, { exact: true }).first()).toBeVisible();
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

  test("should show preferences section", async ({ page }) => {
    // Check preferences section exists
    await expect(page.getByText("What would you like to receive?")).toBeVisible();
  });

  test("should have reminder offset selector", async ({ page }) => {
    await expect(page.getByText("Remind me")).toBeVisible();

    // Should have a select element
    const select = page.locator("select");
    await expect(select).toBeVisible();
  });
});
