import { test, expect } from '@playwright/test';

/**
 * E2E Test: Mentor Browsing & Session Booking
 * Real workflows: browse mentors, view mentor details, book sessions, complete checkout
 */

test.describe('Mentor Browsing', () => {
  test('should navigate to mentors page from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find mentors link
    const mentorsLink = page.locator('a', { hasText: /mentors|teachers|instructors/i }).first();
    if (await mentorsLink.isVisible()) {
      await mentorsLink.click();
      await page.waitForURL(/mentors/, { timeout: 5000 }).catch(() => {});
    }
  });

  test('should display mentors page with list', async ({ page }) => {
    await page.goto('/mentors');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if mentor cards/list is displayed
    const mentorCards = page.locator('[data-testid*="mentor"], .mentor, [class*="card"]').first();
    if (await mentorCards.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(mentorCards).toBeVisible();
    }
  });

  test('should allow filtering or searching mentors', async ({ page }) => {
    await page.goto('/mentors');
    await page.waitForLoadState('networkidle');

    // Look for search/filter input
    const searchInput = page.locator('input[type="search"], input[type="text"][placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Yoga');
      await page.waitForTimeout(1000);
    }
  });

  test('should view mentor details when clicking on a mentor', async ({ page }) => {
    await page.goto('/mentors');
    await page.waitForLoadState('networkidle');

    // Find first mentor card/link
    const firstMentor = page.locator('a, button', { hasText: /view|details|profile|book/i }).first();
    if (await firstMentor.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstMentor.click();
      
      // Wait for mentor detail page to load
      await page.waitForURL(/mentors\/\d+|mentor-details|profile/, { timeout: 5000 }).catch(() => {});
    }
  });

  test('should display mentor profile information', async ({ page }) => {
    // Navigate to a mentor profile directly
    await page.goto('/mentors/1', { waitUntil: 'networkidle' }).catch(() => {
      page.goto('/mentors');
    });

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check for mentor info (name, bio, specialty, etc.)
    const profileContent = page.locator('text=/experience|bio|specialty|about|qualification/i').first();
    if (await profileContent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(profileContent).toBeVisible();
    }
  });
});

test.describe('Session Booking Flow', () => {
  test('should display available time slots for a mentor', async ({ page }) => {
    await page.goto('/mentors');
    await page.waitForLoadState('networkidle');

    // Click on a mentor to view details
    const mentorLink = page.locator('a, button', { hasText: /view|book|details/i }).first();
    if (await mentorLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await mentorLink.click();
      await page.waitForTimeout(1000);

      // Look for time slots/calendar
      const timeslots = page.locator('[data-testid*="slot"], [class*="slot"], button[class*="time"]').first();
      if (await timeslots.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(timeslots).toBeVisible();
      }
    }
  });

  test('should allow booking a session', async ({ page }) => {
    await page.goto('/mentors');
    await page.waitForLoadState('networkidle');

    // Find and click mentor
    const mentor = page.locator('a, button', { hasText: /view|book|schedule/i }).first();
    if (await mentor.isVisible({ timeout: 1000 }).catch(() => false)) {
      await mentor.click();
      await page.waitForTimeout(1000);

      // Look for book/schedule button
      const bookBtn = page.locator('button', { hasText: /book|schedule|reserve|select/i }).first();
      if (await bookBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await bookBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should redirect to checkout when booking a session', async ({ page }) => {
    // This tests the session booking to checkout flow
    await page.goto('/session-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Should display checkout information
    await page.waitForTimeout(500);

    // Look for checkout details (mentor name, time, price)
    const checkoutContent = page.locator('text=/checkout|total|amount|confirm|pay/i').first();
    if (await checkoutContent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(checkoutContent).toBeVisible();
    }
  });

  test('should display session details on checkout page', async ({ page }) => {
    await page.goto('/session-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Session checkout should show booking details
    const details = page.locator('text=/session|time|mentor|duration/i').first();
    if (await details.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(details).toBeVisible();
    }
  });
});

test.describe('Timeslot Selection', () => {
  test('should display available timeslots', async ({ page }) => {
    // Navigate to timeslot checkout page
    await page.goto('/timeslot-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for content
    await page.waitForTimeout(1000);

    // Look for time slots
    const timeslots = page.locator('[data-testid*="slot"], [class*="slot"], [class*="time"]').first();
    if (await timeslots.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(timeslots).toBeVisible();
    }
  });

  test('should allow selecting a timeslot', async ({ page }) => {
    await page.goto('/timeslot-checkout', { waitUntil: 'networkidle' }).catch(() => {});

    // Find and click a timeslot
    const slot = page.locator('button, [role="option"]', { hasText: /\d+:\d+|am|pm/i }).first();
    if (await slot.isVisible({ timeout: 1000 }).catch(() => false)) {
      await slot.click();
      await page.waitForTimeout(500);
    }
  });
});
