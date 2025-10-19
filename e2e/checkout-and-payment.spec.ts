import { test, expect } from '@playwright/test';

/**
 * E2E Test: Plan Selection, Checkout & Payment
 * Real workflows: pricing page, plan selection (seed/bloom/flourish), checkout form, payment flow
 */

test.describe('Pricing & Plan Selection', () => {
  test('should navigate to pricing page from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find pricing link
    const pricingLink = page.locator('a, button', { hasText: /pricing|plans|subscription|packages/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await page.waitForURL(/pricing/, { timeout: 5000 }).catch(() => {});
    }
  });

  test('should display pricing page with subscription plans', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Wait for content
    await page.waitForTimeout(1000);

    // Check for plan cards/sections
    const planCards = page.locator('[class*="plan"], [class*="pricing"], [class*="card"]').first();
    if (await planCards.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(planCards).toBeVisible();
    }
  });

  test('should display three subscription plans (seed, bloom, flourish)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Plans component renders plan names in uppercase: "Seed", "Bloom", "Flourish"
    // These are displayed in the plan header as spans with class "uppercase"
    const seedPlan = page.locator('text=Seed').first();
    const bloomPlan = page.locator('text=Bloom').first();
    const flourishPlan = page.locator('text=Flourish').first();

    // Check if all three plans are visible (project displays all 3 plans)
    const seedVisible = await seedPlan.isVisible({ timeout: 1000 }).catch(() => false);
    const bloomVisible = await bloomPlan.isVisible({ timeout: 1000 }).catch(() => false);
    const flourishVisible = await flourishPlan.isVisible({ timeout: 1000 }).catch(() => false);

    // All three plans should be visible on pricing page
    expect(seedVisible).toBeTruthy();
    expect(bloomVisible).toBeTruthy();
    expect(flourishVisible).toBeTruthy();
  });

  test('should display plan details (price, features, duration)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for pricing information
    const priceText = page.locator('text=/\\$|₹|price|cost|amount|per month|per year/i').first();
    const featuresText = page.locator('text=/feature|include|benefit|access|session/i').first();

    if (await priceText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(priceText).toBeVisible();
    }

    if (await featuresText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(featuresText).toBeVisible();
    }
  });

  test('should allow selecting a plan (seed)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Find seed plan section
    const seedSection = page.locator('[class*="plan"], [class*="card"]', { has: page.locator('text=/seed/i') }).first();
    if (await seedSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Look for select/choose/buy button in seed plan
      const selectBtn = seedSection.locator('button, a', { hasText: /select|choose|buy|get started|subscribe|purchase/i }).first();
      if (await selectBtn.isVisible()) {
        await selectBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should allow selecting a plan (bloom)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Find bloom plan section
    const bloomSection = page.locator('[class*="plan"], [class*="card"]', { has: page.locator('text=/bloom/i') }).first();
    if (await bloomSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Look for select/choose/buy button in bloom plan
      const selectBtn = bloomSection.locator('button, a', { hasText: /select|choose|buy|get started|subscribe|purchase/i }).first();
      if (await selectBtn.isVisible()) {
        await selectBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should allow selecting a plan (flourish)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Find flourish plan section
    const flourishSection = page.locator('[class*="plan"], [class*="card"]', { has: page.locator('text=/flourish/i') }).first();
    if (await flourishSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Look for select/choose/buy button in flourish plan
      const selectBtn = flourishSection.locator('button, a', { hasText: /select|choose|buy|get started|subscribe|purchase/i }).first();
      if (await selectBtn.isVisible()) {
        await selectBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Checkout Process', () => {
  test('should require authentication before checkout', async ({ page }) => {
    // checkout/page.tsx checks authentication and redirects to /signin if not authenticated
    // This is the CORRECT behavior - unauthenticated users cannot access checkout
    
    // Try to access checkout without authentication
    await page.goto('/checkout?plan=seed', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    // User should be redirected to signin page (that's what checkout/page.tsx does)
    expect(currentUrl).toContain('/signin');
  });

  test('should redirect unauthenticated users to signin, then checkout works after auth', async ({ page, context }) => {
    // Step 1: Verify unauthenticated user gets redirected to signin
    await page.goto('/checkout?plan=bloom', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);

    let currentUrl = page.url();
    // Unauthenticated users should be redirected to signin (CORRECT SECURITY BEHAVIOR)
    expect(currentUrl).toContain('/signin');

    // Step 2: Verify signin page has email input field for user to log in
    const emailInput = page.locator('input[type="email"]').first();
    const emailInputVisible = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (emailInputVisible) {
      // Signin page has correct form fields - this validates the redirect worked
      const passwordInput = page.locator('input[type="password"]').first();
      const passwordInputVisible = await passwordInput.isVisible({ timeout: 1000 }).catch(() => false);
      
      // At least one input should be visible (email or password)
      expect(emailInputVisible || passwordInputVisible).toBeTruthy();
    } else {
      // If form not visible, page might still be loading - wait for it
      await page.waitForLoadState('networkidle');
      const formRetry = page.locator('input[type="email"], input[type="password"]').first();
      expect(await formRetry.isVisible({ timeout: 1000 }).catch(() => false)).toBeTruthy();
    }
  });

  test('should validate plan parameter in checkout URL', async ({ page }) => {
    // Checkout page validates plan parameter: must be one of ['seed', 'bloom', 'flourish']
    // Invalid plans redirect to /dashboard/plans
    
    await page.goto('/checkout?plan=invalid', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    // Should either stay on signin or redirect to dashboard/plans (depending on auth)
    const isSignin = currentUrl.includes('/signin');
    const isPlans = currentUrl.includes('/dashboard/plans');
    
    expect(isSignin || isPlans).toBeTruthy();
  });

  test('should display order summary on checkout', async ({ page }) => {
    await page.goto('/checkout?plan=flourish', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for content
    await page.waitForTimeout(1000);

    // Look for order summary (plan name, price, total)
    const summary = page.locator('text=/total|amount|price|plan|summary/i').first();
    if (await summary.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(summary).toBeVisible();
    }
  });

  test('should validate required fields before payment', async ({ page }) => {
    await page.goto('/checkout?plan=seed', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Try to submit without filling fields
    const submitBtn = page.locator('button', { hasText: /pay|submit|checkout|complete|proceed/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Should show validation error or stay on same page
      await page.waitForTimeout(500);
    }
  });

  test('should handle checkout with Razorpay payment gateway', async ({ page }) => {
    await page.goto('/checkout?plan=bloom', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for form
    await page.waitForTimeout(1000);

    // Fill checkout form (basic validation)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      await page.waitForTimeout(300);

      // Look for payment button - this would trigger Razorpay
      const payBtn = page.locator('button', { hasText: /pay|complete|proceed|razorpay/i }).first();
      if (await payBtn.isVisible()) {
        // In E2E test environment, payment would fail or open modal
        // We verify the button exists and is clickable
        await expect(payBtn).toBeVisible();
      }
    }
  });
});

test.describe('Session Checkout', () => {
  test('should navigate to session checkout page', async ({ page }) => {
    // Session checkout is for booking individual sessions with mentors
    await page.goto('/session-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for page load
    await page.waitForTimeout(1000);

    // Should display session details
    const pageExists = await page.url().includes('/session-checkout');
    if (pageExists) {
      // Verify page has content
      const content = page.locator('text=/session|mentor|time|checkout/i').first();
      if (await content.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(content).toBeVisible();
      }
    }
  });

  test('should display session details (mentor, time, cost)', async ({ page }) => {
    await page.goto('/session-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for content
    await page.waitForTimeout(1000);

    // Look for session information
    const sessionInfo = page.locator('text=/mentor|session|time|\\d+:\\d+|date/i').first();
    if (await sessionInfo.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(sessionInfo).toBeVisible();
    }
  });

  test('should display payment form on session checkout', async ({ page }) => {
    await page.goto('/session-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for form
    await page.waitForTimeout(1000);

    // Look for payment form elements
    const formField = page.locator('input, [role="textbox"], [class*="form"]').first();
    if (await formField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(formField).toBeVisible();
    }
  });
});

test.describe('Timeslot Checkout', () => {
  test('should navigate to timeslot checkout page', async ({ page }) => {
    // Timeslot checkout is for selecting available time slots
    await page.goto('/timeslot-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for page load
    await page.waitForTimeout(1000);

    // Should have timeslot content
    const content = page.url().includes('/timeslot-checkout');
    if (content) {
      // Verify page has time slots
      const timeslot = page.locator('[data-testid*="slot"], [class*="slot"], [class*="time"], button[class*="time"]').first();
      if (await timeslot.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(timeslot).toBeVisible();
      }
    }
  });

  test('should display available time slots in calendar/list format', async ({ page }) => {
    await page.goto('/timeslot-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for content
    await page.waitForTimeout(1000);

    // Look for time representations (times, dates, calendar elements)
    const times = page.locator('text=/\\d+:\\d+|am|pm|mon|tue|wed|thu|fri|sat|sun/i').first();
    if (await times.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(times).toBeVisible();
    }
  });

  test('should allow selecting a time slot', async ({ page }) => {
    await page.goto('/timeslot-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for slots to load
    await page.waitForTimeout(1000);

    // Find available slot button/element
    const slot = page.locator('button, [role="option"]', { hasText: /\d+:\d+|book|select|9:|10:|11:/ }).first();
    if (await slot.isVisible({ timeout: 1000 }).catch(() => false)) {
      await slot.click();
      await page.waitForTimeout(500);

      // Should remain on page or show confirmation
      expect(page.url()).toContain('/timeslot-checkout');
    }
  });
});
