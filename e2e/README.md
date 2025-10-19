# E2E Testing Guide - Playwright

## Overview

End-to-End (E2E) tests validate complete user journeys across the YogVaidya platform using Playwright. These tests simulate real user interactions and ensure critical workflows function correctly.

**Framework**: Playwright v1.45+  
**Language**: TypeScript  
**Location**: `e2e/` directory  
**Tests**: 3 spec files with 30+ scenarios

---

## Test Coverage

### 1. **User Journey Tests** (`user-journey.spec.ts`)
- ✅ Student signup and profile completion
- ✅ Browse and view mentor profiles
- ✅ Session booking workflow
- ✅ Payment processing
- ✅ Mentor dashboard operations
- ✅ Admin dashboard access
- ✅ Error handling and edge cases

**Tests**: 14

### 2. **Subscription & Payment** (`subscription-payment.spec.ts`)
- ✅ View and select subscription plans
- ✅ Purchase subscription
- ✅ View active subscription details
- ✅ Upgrade subscription plan
- ✅ Handle cancellation
- ✅ Process payments
- ✅ Handle payment failures
- ✅ Refund workflows
- ✅ Webhook payment confirmation
- ✅ Duplicate payment prevention

**Tests**: 10

### 3. **Authentication** (`authentication.spec.ts`)
- ✅ Login with valid credentials
- ✅ Invalid credential handling
- ✅ Forgot password flow
- ✅ Password reset with token
- ✅ Logout
- ✅ Session timeout
- ✅ 2FA/MFA setup and verification
- ✅ Social login (OAuth)

**Tests**: 12+

---

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All E2E Tests
```bash
npm run e2e
```

### Run Tests in Headed Mode (Visible Browser)
```bash
npm run e2e:headed
```

### Run Tests with Debugger
```bash
npm run e2e:debug
```

### Run Tests with UI
```bash
npm run e2e:ui
```

### View HTML Report
```bash
npm run e2e:report
```

### Run Specific Test File
```bash
npx playwright test e2e/user-journey.spec.ts
```

### Run Specific Test
```bash
npx playwright test -g "should complete full signup"
```

### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## Prerequisites

### Development Environment
1. **Node.js**: v18+ (check with `node --version`)
2. **npm**: v9+ (check with `npm --version`)
3. **Next.js**: Running on `http://localhost:3000`

### Test Environment Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```
   Server must be running at `http://localhost:3000`

2. **In another terminal, run tests**:
   ```bash
   npm run e2e
   ```

### Test Data Requirements

For tests to pass, you may need:

1. **Test user accounts**:
   ```
   Email: test@example.com
   Password: Password123!
   ```

2. **Test mentor accounts** (for mentor flow tests)

3. **Test admin account** (for admin dashboard tests)

### Environment Variables

Create `.env.local` if needed:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

---

## Configuration

### Key Settings (`playwright.config.ts`)

```typescript
{
  // Test directory
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Retries (2 on CI, 0 locally)
  retries: process.env.CI ? 2 : 0,
  
  // Test timeout: 30 seconds
  timeout: 30000,
  
  // Base URL for tests
  baseURL: 'http://localhost:3000',
  
  // Take screenshots on failure
  screenshot: 'only-on-failure',
  
  // Record trace on first retry
  trace: 'on-first-retry',
  
  // Browsers to test
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Devices to test
  devices: ['Desktop Chrome', 'Mobile Chrome', 'Mobile Safari']
}
```

---

## Writing New E2E Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Group', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/page-url');
    
    // Act
    await page.click('button');
    await page.fill('input', 'value');
    
    // Assert
    await expect(page).toHaveURL('/expected-url');
    await expect(page.locator('text=Success')).toBeTruthy();
  });
});
```

### Common Patterns

#### Navigate to Page
```typescript
await page.goto('/dashboard');
```

#### Wait for Element
```typescript
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
```

#### Fill Form
```typescript
await page.fill('input[type="email"]', 'user@test.com');
await page.fill('input[type="password"]', 'password');
```

#### Click Button
```typescript
await page.click('button:has-text("Sign In")');
// or
await page.locator('button', { hasText: /sign in/i }).click();
```

#### Check URL
```typescript
await expect(page).toHaveURL('/dashboard');
```

#### Verify Content
```typescript
await expect(page.locator('text=Success')).toBeTruthy();
```

#### Handle Multiple Elements
```typescript
const items = page.locator('[data-testid="item"]').all();
expect(items.length).toBeGreaterThan(0);
```

---

## Best Practices

### 1. Use Data Attributes
```typescript
// Good
await page.click('[data-testid="login-button"]');

// Avoid
await page.click('button');  // Too generic
```

### 2. Wait for Elements Properly
```typescript
// Good - explicit wait
await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

// Good - wait for navigation
await page.waitForURL(/dashboard/i, { timeout: 10000 });

// Avoid
await page.waitForTimeout(5000);  // Hard wait
```

### 3. Use Flexible Selectors
```typescript
// Good - flexible
await page.locator('button', { hasText: /sign in|login/i }).click();

// Less flexible
await page.click('button.btn-primary.mt-4');
```

### 4. Test as User Would
```typescript
// Good - user perspective
await page.fill('input[type="email"]', 'user@test.com');
await page.fill('input[type="password"]', 'password');
await page.locator('button', { hasText: /sign in/i }).click();

// Avoid
page.evaluate(() => {
  localStorage.setItem('auth_token', 'fake_token');
});
```

### 5. Handle Async Operations
```typescript
// Good - wait for state change
await page.fill('input', 'search');
await page.waitForSelector('[data-testid="results"]', { timeout: 10000 });

// Better - wait for navigation
await page.click('a[href="/page"]');
await page.waitForURL(/\/page/i);
```

---

## Debugging Tests

### Run in Debug Mode
```bash
npm run e2e:debug
```
This opens the Playwright Inspector where you can:
- Step through code
- Inspect elements
- See DOM state

### View Test Report
```bash
npm run e2e:report
```
Shows HTML report with:
- Test results
- Screenshots
- Traces
- Timings

### Print Debugging
```typescript
test('example', async ({ page }) => {
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  console.log('Text content:', await page.textContent('body'));
});
```

### Screenshot on Demand
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Take Trace
```typescript
await page.context().tracing.start({ screenshots: true, snapshots: true });
// ... do something
await page.context().tracing.stop({ path: 'trace.zip' });
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Tests Fail with "Timeout"
**Solution**:
- Ensure dev server is running: `npm run dev`
- Increase timeout in test:
  ```typescript
  await page.waitForSelector(sel, { timeout: 30000 });
  ```
- Check internet/network connection

### Tests Fail with "Element Not Found"
**Solution**:
- Check if selector is correct:
  ```bash
  npx playwright inspect  # Open inspector
  ```
- Wait for element to load
- Use more flexible selectors:
  ```typescript
  page.locator('button', { hasText: /click/i })
  ```

### Tests Pass Locally but Fail in CI
**Solution**:
- Diff between local and CI environment
- Use absolute timeouts (not relative)
- Ensure test data exists in CI
- Check network calls aren't being mocked

### Memory Issues with Many Tests
**Solution**:
- Reduce parallel workers:
  ```typescript
  workers: 1  // in playwright.config.ts
  ```
- Clear browser cache:
  ```bash
  rm -rf test-results/
  ```

---

## Continuous Integration

### Pre-PR Checklist
- [ ] Tests run locally: `npm run e2e`
- [ ] No hardcoded environment values
- [ ] Uses test-specific selectors
- [ ] Includes meaningful test names
- [ ] Handles async operations correctly

### Pre-Production Checklist
- [ ] All E2E tests passing
- [ ] No flaky tests (run multiple times)
- [ ] Screenshots/traces reviewed
- [ ] Performance acceptable (< 5s per test)

---

## Resources

- **Playwright Docs**: https://playwright.dev/
- **Best Practices**: https://playwright.dev/docs/best-practices
- **API Reference**: https://playwright.dev/docs/api/class-page
- **Selectors Guide**: https://playwright.dev/docs/locators
- **Debugging**: https://playwright.dev/docs/debug

---

## Support

For issues or questions:
1. Check Playwright documentation
2. Review existing test examples
3. Check browser console for errors
4. Run in debug mode: `npm run e2e:debug`

---

**Last Updated**: October 18, 2025
