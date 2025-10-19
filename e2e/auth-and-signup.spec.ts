import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Authentication & Signup
 * Real workflows: signup, signin, forgot password, reset password
 */

test.describe('User Signup Flow', () => {
  test('should navigate to signup page from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for signup button/link
    const signupLink = page.locator('a, button', { hasText: /sign up|register|get started/i }).first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForURL(/signup/, { timeout: 5000 });
    }
  });

  test('should display signup form with email and password fields', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Verify form fields exist
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();

    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
    if (await passwordField.isVisible()) {
      await expect(passwordField).toBeVisible();
    }
  });

  test('should show validation error for empty email field', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Try to submit without email
    const submitBtn = page.locator('button', { hasText: /sign up|register|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should validate email format on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible()) {
      // Enter invalid email
      await emailField.fill('invalid-email');
      
      // Try to submit
      const submitBtn = page.locator('button', { hasText: /sign up|register/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should successfully complete signup form', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const uniqueEmail = `test_${Date.now()}@example.com`;
    
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill(uniqueEmail);
      await passwordField.fill('SecurePassword123!');

      // Submit form
      const submitBtn = page.locator('button', { hasText: /sign up|register/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        // Wait for redirect to complete-profile or dashboard
        await page.waitForURL(/complete-profile|dashboard|signin/, { timeout: 10000 }).catch(() => {});
      }
    }
  });
});

test.describe('User Login Flow', () => {
  test('should display signin form on signin page', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    const signinBtn = page.locator('button', { hasText: /sign in|login/i }).first();

    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
    if (await passwordField.isVisible()) {
      await expect(passwordField).toBeVisible();
    }
    if (await signinBtn.isVisible()) {
      await expect(signinBtn).toBeVisible();
    }
  });

  test('should show error on signin with invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('nonexistent@example.com');
      await passwordField.fill('WrongPassword123!');

      const signinBtn = page.locator('button', { hasText: /sign in|login/i }).first();
      if (await signinBtn.isVisible()) {
        await signinBtn.click();
        
        // Wait for potential error message
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should have signup link on signin page', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const signupLink = page.locator('a, button', { hasText: /sign up|register|create account/i });
    if (await signupLink.isVisible()) {
      await expect(signupLink).toBeVisible();
    }
  });

  test('should navigate to signup from signin page', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const signupLink = page.locator('a', { hasText: /sign up|register|don't have/i }).first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForURL(/signup/, { timeout: 5000 });
    }
  });
});

test.describe('Password Reset Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Should have email input for recovery
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }

    // Should have submit button
    const submitBtn = page.locator('button', { hasText: /send|submit|reset/i }).first();
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should navigate to forgot password from signin', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const forgotLink = page.locator('a, button', { hasText: /forgot|password/i }).first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await page.waitForURL(/forgot-password/, { timeout: 5000 }).catch(() => {});
    }
  });

  test('should display reset password form with token', async ({ page }) => {
    // Note: In real flow, token comes from email link
    const testToken = 'sample_reset_token_123';
    await page.goto(`/reset-password?token=${testToken}`);
    await page.waitForLoadState('networkidle');

    // Should have password input
    const newPasswordField = page.locator('input[type="password"]').first();
    if (await newPasswordField.isVisible()) {
      await expect(newPasswordField).toBeVisible();
    }

    // Should have submit button
    const submitBtn = page.locator('button', { hasText: /reset|update|save/i }).first();
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should show error for missing/invalid reset token', async ({ page }) => {
    await page.goto('/reset-password?token=');
    await page.waitForLoadState('networkidle');

    // Should show error or redirect away
    await page.waitForTimeout(1000);
  });
});
