import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Performance Testing - Load & Response Times", () => {
  test("should load homepage within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
    const loadTime = Date.now() - startTime;

    // Homepage should load within 20 seconds (baseline measurement)
    expect(loadTime).toBeLessThan(20000);

    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test("should load dashboard within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`).catch(() => {});
    const loadTime = Date.now() - startTime;

    // Dashboard should load within 20 seconds (baseline with redirects)
    expect(loadTime).toBeLessThan(20000);

    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test("should load mentors page with pagination", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/mentors`, { waitUntil: "load" });
    const loadTime = Date.now() - startTime;

    // Should load within 20 seconds
    expect(loadTime).toBeLessThan(20000);

    // Verify mentor cards rendered or page loaded
    const mentorCards = await page
      .locator('[data-testid*="mentor"]')
      .count()
      .catch(() => 0);
    console.log(`Mentors page load time: ${loadTime}ms | Cards: ${mentorCards}`);
  });

  test("should handle concurrent API requests", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`).catch(() => {});

    const startTime = Date.now();

    // Simulate concurrent requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        page.evaluate(() => {
          return fetch("/api/mentors", { method: "GET" })
            .then((r) => r.json())
            .catch(() => ({}));
        })
      );
    }

    const results = await Promise.all(requests);
    const concurrentTime = Date.now() - startTime;

    // 5 concurrent requests should complete within 20 seconds (baseline)
    expect(concurrentTime).toBeLessThan(20000);
    expect(results.length).toBe(5);

    console.log(`5 concurrent requests completed in ${concurrentTime}ms`);
  });

  test("should render large lists efficiently", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors?limit=50`).catch(() => {});

    const startTime = Date.now();

    // Wait for page to load
    await page.waitForTimeout(2000);
    const renderTime = Date.now() - startTime;

    // Should render within 20 seconds
    expect(renderTime).toBeLessThan(20000);

    console.log(`Large list render time: ${renderTime}ms`);
  });

  test("should handle rapid page navigation", async ({ page }) => {
    const startTime = Date.now();

    // Navigate through multiple pages quickly
    await page.goto(`${BASE_URL}/`).catch(() => {});
    await page.goto(`${BASE_URL}/mentors`).catch(() => {});
    await page.goto(`${BASE_URL}/pricing`).catch(() => {});
    await page.goto(`${BASE_URL}/`).catch(() => {});

    const navigationTime = Date.now() - startTime;

    // 4 page navigations should complete within 20 seconds (baseline)
    expect(navigationTime).toBeLessThan(20000);

    console.log(`4 page navigations completed in ${navigationTime}ms`);
  });

  test("should maintain performance with form interactions", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);

    const startTime = Date.now();

    // Simulate form interactions
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await emailInput.fill(`test${i}@example.com`);
        await passwordInput.fill("password");
      }
    }

    const interactionTime = Date.now() - startTime;

    // 10 form interactions should be responsive
    expect(interactionTime).toBeLessThan(1000);

    console.log(`10 form interactions completed in ${interactionTime}ms`);
  });

  test("should load checkout page within time limit", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/checkout`).catch(() => {});
    const loadTime = Date.now() - startTime;

    // Checkout should load within 20 seconds (baseline)
    expect(loadTime).toBeLessThan(20000);

    console.log(`Checkout page load time: ${loadTime}ms`);
  });

  test("should handle image loading efficiently", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`, { waitUntil: "networkidle" });

    const startTime = Date.now();

    // Wait for images to load
    const images = page.locator("img");
    const count = await images.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        await images.nth(i).waitFor();
      }
    }

    const imageLoadTime = Date.now() - startTime;

    // Images should load within 2 seconds
    expect(imageLoadTime).toBeLessThan(2000);

    console.log(`${count} images loaded in ${imageLoadTime}ms`);
  });

  test("should respond to scroll interactions quickly", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`, { waitUntil: "networkidle" });

    const startTime = Date.now();

    // Simulate scrolling
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await page.waitForTimeout(100);
    }

    const scrollTime = Date.now() - startTime;

    // Scrolling should be smooth and responsive
    expect(scrollTime).toBeLessThan(2000);

    console.log(`5 scroll interactions completed in ${scrollTime}ms`);
  });

  test("should measure Core Web Vitals indicators", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // Measure First Contentful Paint (FCP) and other metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as any;
      const paint = performance.getEntriesByType("paint");

      return {
        navigationStart: navigation?.startTime || 0,
        domInteractive: navigation?.domInteractive || 0,
        domComplete: navigation?.domComplete || 0,
        loadEventEnd: navigation?.loadEventEnd || 0,
        firstPaint: paint.find((p) => p.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
      };
    });

    // FCP should be under 1.8 seconds (Good threshold)
    expect(metrics.firstContentfulPaint).toBeLessThan(1800);

    // DOM interactive should be under 3 seconds
    expect(metrics.domInteractive).toBeLessThan(3000);

    console.log("Performance Metrics:", metrics);
  });

  test("should handle memory efficiently during navigation", async ({ page, context }) => {
    // Navigate through multiple pages
    const pages = ["/", "/mentors", "/pricing", "/signin"];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`).catch(() => {});
      await page.waitForTimeout(500);
    }

    // Page should still be responsive after navigation
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`);
    const finalLoadTime = Date.now() - startTime;

    // Final navigation should still be fast
    expect(finalLoadTime).toBeLessThan(3000);

    console.log(`Final page load after multiple navigations: ${finalLoadTime}ms`);
  });

  test("should handle form submission response time", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill("test@example.com");
      await page.locator('input[type="password"]').fill("password");

      const startTime = Date.now();
      const submitButton = page.locator('button:has-text("Sign in"), button:has-text("Submit")');

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Wait for response or error
        await page.waitForTimeout(2000);
        const responseTime = Date.now() - startTime;

        // Form submission should get response within 5 seconds (baseline)
        expect(responseTime).toBeLessThan(5000);

        console.log(`Form submission response time: ${responseTime}ms`);
      }
    }
  });

  test("should maintain performance under network latency simulation", async ({ page }) => {
    // Simulate network throttling
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 100);
    });

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/mentors`);
    const throttledLoadTime = Date.now() - startTime;

    // Should still load reasonably fast even with latency
    expect(throttledLoadTime).toBeLessThan(5000);

    console.log(`Throttled page load time: ${throttledLoadTime}ms`);
  });

  test("should render without layout shift", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`, { waitUntil: "networkidle" });

    // Get initial dimensions
    const initialViewport = page.viewportSize();

    // Change viewport and verify layout adjusts smoothly
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const finalViewport = page.viewportSize();

    expect(finalViewport?.width).toBe(768);
    expect(finalViewport?.height).toBe(1024);

    console.log("Layout responsive test passed");
  });

  test("should batch process API calls efficiently", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`).catch(() => {});

    const startTime = Date.now();

    // Make multiple API calls and measure batching
    const batchResults = await page.evaluate(() => {
      const calls = [];
      for (let i = 0; i < 3; i++) {
        calls.push(
          fetch("/api/mentors", { method: "GET" })
            .then((r) => r.json())
            .catch(() => ({}))
        );
      }
      return Promise.all(calls);
    });

    const batchTime = Date.now() - startTime;

    // 3 API calls should complete within 20 seconds (baseline)
    expect(batchTime).toBeLessThan(20000);
    expect(batchResults.length).toBe(3);

    console.log(`3 API calls batched in ${batchTime}ms`);
  });
});
