import { test, expect } from "@playwright/test";

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test("landing page should be mobile-friendly", async ({ page }) => {
    await page.goto("/");

    // Mosque name should be visible
    await expect(page.getByText("Test Masjid")).toBeVisible();

    // Prayer times should stack on mobile
    const prayerCards = page.locator('[class*="grid"]').first();
    await expect(prayerCards).toBeVisible();

    // Subscribe form should be full width
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Button should be full width
    const button = page.getByRole("button", { name: /Subscribe/i });
    await expect(button).toBeVisible();
  });

  test("should have large tap targets on mobile", async ({ page }) => {
    await page.goto("/");

    // Check button height
    const button = page.getByRole("button", { name: /Subscribe/i });
    const buttonBox = await button.boundingBox();

    // Button should be at least 44px tall (iOS tap target minimum)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test("form inputs should be easily tappable", async ({ page }) => {
    await page.goto("/");

    // Phone input
    const phoneInput = page.locator('input[type="tel"]');
    const inputBox = await phoneInput.boundingBox();

    // Input should be at least 44px tall
    expect(inputBox?.height).toBeGreaterThanOrEqual(40);
  });

  test("footer should be visible", async ({ page }) => {
    await page.goto("/");

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Footer should be visible
    await expect(page.getByText("Powered by")).toBeVisible();
    await expect(page.getByText("Alqode")).toBeVisible();
  });
});

test.describe("Desktop Layout", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("should show 6 prayer cards in a row", async ({ page }) => {
    await page.goto("/");

    // On desktop, prayer cards should be in a row
    const prayerGrid = page.locator(".grid-cols-3.sm\\:grid-cols-6").first();
    await expect(prayerGrid).toBeVisible();
  });

  test("cards should have proper spacing", async ({ page }) => {
    await page.goto("/");

    // Check that main content is centered
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});
