# Testing Patterns

**Analysis Date:** 2025-01-31

## Test Framework

**Runner:**
- Playwright v1.58.1
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright built-in `expect` assertions

**Run Commands:**
```bash
npm test              # Run all tests headless
npm run test:ui       # Run with Playwright UI
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root
- Not co-located with source files

**Naming:**
- Pattern: `{feature}.spec.ts`
- Examples: `subscription.spec.ts`, `admin-auth.spec.ts`, `mobile.spec.ts`

**Structure:**
```
tests/
├── subscription.spec.ts    # Subscription flow E2E tests
├── admin-auth.spec.ts      # Admin authentication tests
└── mobile.spec.ts          # Mobile responsiveness tests
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should do something specific", async ({ page }) => {
    // Arrange - setup
    // Act - user action
    await page.click('button:has-text("Submit")');
    // Assert - verify outcome
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

**Patterns:**
- Setup: `test.beforeEach()` for common navigation
- Viewport config: `test.use({ viewport: { width: 375, height: 667 } })`
- Descriptive test names with "should" prefix

## Playwright Configuration

**Key Settings (`playwright.config.ts`):**
```typescript
{
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
}
```

**Projects (Browser Targets):**
- Desktop Chrome (`chromium`)
- Mobile Chrome (`Pixel 5` device emulation)

**Dev Server:**
```typescript
webServer: {
  command: "npm run dev",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

## Selectors

**Preferred Patterns:**
```typescript
// Text content
page.getByText("Test Masjid")
page.getByText(/Invalid|incorrect|failed/i)

// Role-based
page.getByRole("button", { name: "Sign In" })
page.getByRole("button", { name: /Subscribe/i })

// Placeholder text
page.getByPlaceholder("Email address")
page.getByPlaceholder("Password")

// CSS selectors (when needed)
page.locator('input[type="tel"]')
page.locator('button:has-text("Subscribe via WhatsApp")')
page.locator('[class*="grid"]')
```

**Chaining:**
```typescript
page.locator('text="Fajr reminders"').locator("..").locator("input")
```

## Assertions

**Visibility:**
```typescript
await expect(page.getByText("Mosque Name")).toBeVisible();
await expect(element).toBeVisible({ timeout: 10000 });
```

**URL:**
```typescript
await expect(page).toHaveURL(/\/admin\/login/);
```

**Form State:**
```typescript
await expect(checkbox).toBeChecked();
await expect(select).toHaveValue("15");
```

**Dimensions:**
```typescript
const box = await element.boundingBox();
expect(box?.height).toBeGreaterThanOrEqual(44);
```

## Test Categories

**Subscription Flow (`subscription.spec.ts`):**
- Landing page display verification
- Prayer times visibility
- Phone number validation
- Preference checkbox functionality
- Reminder offset selector

**Admin Authentication (`admin-auth.spec.ts`):**
- Redirect when not authenticated
- Login form display
- Invalid credentials handling

**Mobile Responsiveness (`mobile.spec.ts`):**
- Mobile viewport testing (375x667)
- Touch target sizes (44px minimum)
- Layout verification
- Desktop layout testing (1280x720)

## Page Actions

**Navigation:**
```typescript
await page.goto("/");
await page.goto("/admin/login");
```

**Form Interaction:**
```typescript
await page.fill('input[type="email"]', "test@example.com");
await page.fill('input[type="tel"]', "123");
await page.click('button:has-text("Sign In")');
await page.click('text="All 5 daily prayers"');
```

**Scroll:**
```typescript
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
```

## Test Data

**Approach:**
- Hardcoded test values in test files
- Relies on seeded database data ("Test Masjid")
- No dedicated fixtures or factories

**Example Test Data:**
```typescript
const prayers = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const preferences = [
  "Fajr reminders",
  "All 5 daily prayers",
  "Jumu'ah reminder",
  "Program announcements",
  "Daily hadith",
  "Ramadan reminders",
];
```

## Coverage

**Requirements:** None enforced

**View Coverage:** Not configured

## Test Types

**E2E Tests (Current):**
- Full browser automation
- Real UI interactions
- Tests complete user flows

**Unit Tests:**
- Not currently implemented
- No Jest/Vitest configuration

**Integration Tests:**
- Not currently implemented
- API routes tested indirectly through E2E

## Missing Test Coverage

**Areas Without Tests:**
- API route unit tests (`src/app/api/`)
- Utility function unit tests (`src/lib/`)
- Component unit tests
- Supabase query mocking
- WhatsApp API mocking
- Error state testing
- Cron job logic testing

## Adding New Tests

**New E2E Test:**
1. Create `tests/{feature}.spec.ts`
2. Import from `@playwright/test`
3. Use `test.describe()` for grouping
4. Follow existing patterns for selectors

**Test File Template:**
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/path");
  });

  test("should verify expected behavior", async ({ page }) => {
    // Setup
    // Action
    // Assertion
  });
});
```

**Mobile Test Pattern:**
```typescript
test.describe("Mobile Feature", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should work on mobile", async ({ page }) => {
    // Test mobile-specific behavior
  });
});
```

## CI/CD Integration

**Configuration:**
- `forbidOnly: !!process.env.CI` prevents `.only()` in CI
- `retries: process.env.CI ? 2 : 0` adds retries in CI
- `workers: process.env.CI ? 1 : undefined` limits parallelism in CI
- Trace captured on first retry for debugging

## Best Practices Observed

**Good:**
- Clear test descriptions
- Viewport-specific test suites
- Touch target size validation
- Regex patterns for flexible matching

**Could Improve:**
- Add unit tests for business logic
- Mock external APIs (WhatsApp, Aladhan)
- Add coverage reporting
- Create test data factories
- Test error states more comprehensively

---

*Testing analysis: 2025-01-31*
