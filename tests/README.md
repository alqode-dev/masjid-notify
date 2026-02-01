# Admin Dashboard E2E Tests

## Setup

### 1. Install Playwright browsers

```bash
npx playwright install
```

### 2. Set test credentials

Create a `.env.test.local` file in the project root with your test admin credentials:

```env
TEST_ADMIN_EMAIL=your-admin@email.com
TEST_ADMIN_PASSWORD=your-password
```

Or set them as environment variables before running tests:

```bash
# PowerShell
$env:TEST_ADMIN_EMAIL="your-admin@email.com"
$env:TEST_ADMIN_PASSWORD="your-password"

# Bash
export TEST_ADMIN_EMAIL="your-admin@email.com"
export TEST_ADMIN_PASSWORD="your-password"
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run with UI (interactive)
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test admin-dashboard
npx playwright test admin-settings
npx playwright test admin-subscribers
npx playwright test admin-announcements
npx playwright test admin-qrcode
npx playwright test admin-navigation
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run only failed tests
```bash
npx playwright test --last-failed
```

## Test Coverage

### Login (`admin-auth.spec.ts`)
- ✅ Redirect to login when not authenticated
- ✅ Login form displays correctly
- ✅ Error message for invalid credentials

### Dashboard (`admin-dashboard.spec.ts`)
- ✅ Page loads without infinite loading
- ✅ Mosque name displays
- ✅ Statistics cards visible
- ✅ Quick action cards work
- ✅ Analytics section visible

### Subscribers (`admin-subscribers.spec.ts`)
- ✅ Page loads with subscriber table
- ✅ Search by phone number
- ✅ Status filter works
- ✅ Export CSV button
- ✅ Delete confirmation dialog

### Announcements (`admin-announcements.spec.ts`)
- ✅ Page loads without errors
- ✅ Message textarea accepts input
- ✅ Character count updates
- ✅ Send Now / Schedule toggle
- ✅ Preview functionality
- ✅ Datetime picker for scheduling
- ✅ Button states (disabled/enabled)

### Settings (`admin-settings.spec.ts`)
- ✅ Page loads without infinite loading (previously fixed bug)
- ✅ Prayer time settings visible
- ✅ Calculation method dropdown
- ✅ Madhab selection
- ✅ Jumuah times editable
- ✅ Ramadan mode toggle
- ✅ Ramadan options show/hide
- ✅ Save button works with toast

### QR Code (`admin-qrcode.spec.ts`)
- ✅ Page loads without errors
- ✅ QR code displays
- ✅ URL input with correct value
- ✅ Copy URL button
- ✅ Share tips displayed

### Navigation (`admin-navigation.spec.ts`)
- ✅ Sidebar navigation
- ✅ Auth redirects
- ✅ Responsive layouts
- ✅ Page headings

## Troubleshooting

### Tests timeout waiting for login
Make sure your test credentials are correct and the admin account exists in the database.

### Tests fail on CI
The `playwright.config.ts` is set up to auto-start the dev server. On CI, you may need to ensure the database is accessible.

### Flaky tests
Increase timeouts or add explicit waits for network requests to complete.

## Adding New Tests

1. Create a new file in `tests/` with `.spec.ts` extension
2. Import the login helper or copy it
3. Use `test.describe` to group related tests
4. Use `test.beforeEach` for setup (like login)
5. Run your new tests: `npx playwright test your-file-name`
