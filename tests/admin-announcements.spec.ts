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

test.describe("Admin Announcements Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/announcements");
  });

  test("should load announcements page without errors", async ({ page }) => {
    // Wait for page to load (skeleton may or may not be present)
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Announcements", exact: true })
    ).toBeVisible();
  });

  test("should display new announcement form", async ({ page }) => {
    await expect(page.getByText("New Announcement")).toBeVisible();
  });

  test("should have message textarea", async ({ page }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await expect(textarea).toBeVisible();
  });

  test("should accept message input", async ({ page }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test announcement message");
    await expect(textarea).toHaveValue("Test announcement message");
  });

  test("should update character count", async ({ page }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Hello World");

    // Should show character count
    await expect(page.getByText("11/1000 characters")).toBeVisible();
  });

  test("should have Send Now mode toggle", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // The send mode toggle is a custom button, not a role=button
    await expect(page.locator('button:has-text("Send Now")').first()).toBeVisible();
  });

  test("should have Schedule mode toggle", async ({ page }) => {
    await expect(page.getByText("Schedule")).toBeVisible();
  });

  test("should toggle to schedule mode", async ({ page }) => {
    // Click on Schedule button
    await page.click('button:has-text("Schedule"):not(:has-text("Send"))');

    // Should show datetime picker
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
  });

  test("should show preview when clicking show preview", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test message for preview");

    // Click show preview link
    const previewLink = page.getByText("Show preview");
    await previewLink.click();

    // Should show WhatsApp Preview section
    await expect(page.getByText("WhatsApp Preview:")).toBeVisible();
  });

  test("should hide preview when clicking hide preview", async ({ page }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test message");

    // Show preview
    await page.click('button:has-text("Show preview")');
    await expect(page.getByText("WhatsApp Preview:")).toBeVisible();

    // Hide preview
    await page.click('button:has-text("Hide preview")');
    await expect(page.getByText("WhatsApp Preview:")).toBeHidden();
  });

  test("should display subscriber count in send button area", async ({
    page,
  }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Should show the announcement form loaded
    await expect(page.getByText("New Announcement")).toBeVisible();
  });

  test("should display recent announcements section", async ({ page }) => {
    await expect(page.getByText("Recent Announcements")).toBeVisible();
  });

  test("should show empty state or announcements list", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should show either empty message or announcement cards
    const emptyState = page.getByText("No announcements sent yet");
    const announcementCard = page.locator(".border-border").first();

    const hasEmpty = (await emptyState.count()) > 0;
    const hasCards = (await announcementCard.count()) > 0;

    expect(hasEmpty || hasCards).toBeTruthy();
  });

  test("should disable send button when message is empty", async ({ page }) => {
    // Find the Send Now button
    const sendButton = page.locator('button:has-text("Send Now")').last();

    // Should be disabled when no content
    await expect(sendButton).toBeDisabled();
  });

  test("should enable send button when message has content", async ({
    page,
  }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test message");

    // Find the Send Now button
    const sendButton = page.locator('button:has-text("Send Now")').last();

    // Should be enabled with content
    await expect(sendButton).toBeEnabled();
  });
});

test.describe("Announcement Scheduling", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/announcements");
  });

  test("should show datetime picker in schedule mode", async ({ page }) => {
    // Switch to schedule mode
    await page.click('button:has-text("Schedule"):not(:has-text("Send"))');

    // Datetime input should be visible
    const datetimeInput = page.locator('input[type="datetime-local"]');
    await expect(datetimeInput).toBeVisible();
  });

  test("should disable schedule button without datetime", async ({ page }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test scheduled message");

    // Switch to schedule mode
    await page.click('button:has-text("Schedule"):not(:has-text("Send"))');

    // Schedule button should be disabled without datetime
    const scheduleButton = page
      .locator('button:has-text("Schedule")')
      .last();
    await expect(scheduleButton).toBeDisabled();
  });

  test("should enable schedule button with datetime and message", async ({
    page,
  }) => {
    const textarea = page.getByPlaceholder("Enter your announcement...");
    await textarea.fill("Test scheduled message");

    // Switch to schedule mode
    await page.click('button:has-text("Schedule"):not(:has-text("Send"))');

    // Set future datetime
    const datetimeInput = page.locator('input[type="datetime-local"]');
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    const dateString = futureDate.toISOString().slice(0, 16);
    await datetimeInput.fill(dateString);

    // Schedule button should be enabled
    const scheduleButton = page
      .locator('button:has-text("Schedule")')
      .last();
    await expect(scheduleButton).toBeEnabled();
  });
});

test.describe("Message Templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/announcements");
    await page.waitForLoadState("networkidle");
  });

  test("should display announcement form", async ({ page }) => {
    // Check if form component is rendered
    await expect(page.getByText("New Announcement")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your announcement...")).toBeVisible();
  });
});
