import { test, expect } from "@playwright/test";

test.describe("Admin Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/admin/login");

    // Check for login elements
    await expect(page.getByText("Admin Login")).toBeVisible();
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/admin/login");

    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button:has-text("Sign In")');

    // Should show error message
    await expect(page.getByText(/Invalid|incorrect|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
