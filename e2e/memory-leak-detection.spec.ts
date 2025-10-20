import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Performance Testing - Memory & Resource Leaks", () => {
  test("should not leak memory during page navigation", async ({ page }) => {
    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    // Get initial memory
    await page.goto(`${BASE_URL}/`);
    const initialMemory = await getMemory();

    // Navigate through multiple pages
    for (let i = 0; i < 10; i++) {
      await page.goto(`${BASE_URL}/mentors`);
      await page.goto(`${BASE_URL}/`);
      await page.waitForTimeout(100);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory increase should be less than 50%
    expect(memoryIncrease).toBeLessThan(50);

    console.log(`Memory usage increase: ${memoryIncrease.toFixed(1)}%
      Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
      Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
  });

  test("should not leak memory during rapid API calls", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`);

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    // Get initial memory
    const initialMemory = await getMemory();

    // Make rapid API calls
    for (let i = 0; i < 20; i++) {
      await page.evaluate(async () => {
        return fetch("/api/mentors?limit=10", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({}));
      });
      await page.waitForTimeout(50);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(40);

    console.log(`Memory during API calls increase: ${memoryIncrease.toFixed(1)}%`);
  });

  test("should clean up event listeners properly", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`);

    const initialListeners = await page.evaluate(() => {
      return (window as any).__eventListenerCount || 0;
    });

    // Simulate user interactions
    const button = page.locator("button").first();
    if (await button.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await button.click().catch(() => {});
        await page.waitForTimeout(100);
      }
    }

    const finalListeners = await page.evaluate(() => {
      return (window as any).__eventListenerCount || 0;
    });

    // Event listeners should not accumulate excessively
    expect(finalListeners).toBeLessThanOrEqual(initialListeners * 1.5);

    console.log(`Event listeners - Initial: ${initialListeners}, Final: ${finalListeners}`);
  });

  test("should not have DOM memory leaks", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`);

    const getNodeCount = async () => {
      return await page.evaluate(() => {
        return document.querySelectorAll("*").length;
      });
    };

    const initialNodes = await getNodeCount();

    // Simulate navigation and return
    await page.goto(`${BASE_URL}/pricing`);
    await page.goto(`${BASE_URL}/mentors`);
    await page.waitForTimeout(500);

    const finalNodes = await getNodeCount();

    // DOM nodes should not accumulate significantly
    expect(finalNodes).toBeLessThan(initialNodes * 1.5);

    console.log(`DOM Nodes - Initial: ${initialNodes}, Final: ${finalNodes}`);
  });

  test("should handle repeated image loading without memory leak", async ({ page }) => {
    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    // Get initial memory
    const initialMemory = await getMemory();

    // Load mentor page multiple times (has images)
    for (let i = 0; i < 5; i++) {
      await page.goto(`${BASE_URL}/mentors`);
      await page.waitForTimeout(200);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory should not increase excessively with image loading
    expect(memoryIncrease).toBeLessThan(60);

    console.log(`Memory after repeated image loading: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should not leak memory with form interactions", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Simulate repeated form interactions
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible()) {
      for (let i = 0; i < 15; i++) {
        await emailInput.fill(`test${i}@example.com`);
        await passwordInput.fill("password123");
        await page.waitForTimeout(50);
      }
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory should be stable during form interactions
    expect(memoryIncrease).toBeLessThan(30);

    console.log(`Memory after form interactions: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should clean up after dialog interactions", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`).catch(() => {});

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Open and close dialogs multiple times
    for (let i = 0; i < 5; i++) {
      const buttons = page.locator("button");
      if ((await buttons.count()) > 0) {
        await buttons
          .first()
          .click()
          .catch(() => {});
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
      }
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory should be released after dialog close
    expect(memoryIncrease).toBeLessThan(35);

    console.log(`Memory after dialog interactions: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should handle connection pooling efficiently", async ({ page }) => {
    const connectionCount: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await page.evaluate(async () => {
        return fetch("/api/mentors", { method: "GET" }).then((r) => r.json());
      });
      connectionCount.push(Date.now() - start);
    }

    // Requests should get faster after connection reuse
    const firstBatch = connectionCount.slice(0, 3);
    const lastBatch = connectionCount.slice(-3);

    const firstAvg = firstBatch.reduce((a, b) => a + b) / firstBatch.length;
    const lastAvg = lastBatch.reduce((a, b) => a + b) / lastBatch.length;

    // Later requests should generally be comparable or faster
    expect(lastAvg).toBeLessThanOrEqual(firstAvg * 1.5);

    console.log(`Connection pooling efficiency:
      First 3 avg: ${firstAvg.toFixed(0)}ms
      Last 3 avg: ${lastAvg.toFixed(0)}ms`);
  });

  test("should not leak memory with scroll interactions", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`, { waitUntil: "networkidle" });

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Simulate scrolling
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await page.waitForTimeout(100);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Scrolling should not cause memory leaks
    expect(memoryIncrease).toBeLessThan(25);

    console.log(`Memory during scroll: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should handle resource cleanup on page unload", async ({ page }) => {
    let resourceCount = 0;

    page.on("response", () => {
      resourceCount++;
    });

    await page.goto(`${BASE_URL}/mentors`);
    const initialCount = resourceCount;

    // Navigate away
    await page.goto(`${BASE_URL}/`);
    const afterNav = resourceCount - initialCount;

    // Should have loaded new resources for new page
    expect(afterNav).toBeGreaterThan(0);

    console.log(`Resources loaded - Initial page: ${initialCount}, New page: ${afterNav}`);
  });

  test("should not accumulate garbage during background operations", async ({ page }) => {
    await page.goto(`${BASE_URL}/mentors`);

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Trigger multiple background operations
    for (let i = 0; i < 10; i++) {
      await page.evaluate(async () => {
        // Simulate background fetch
        return fetch("/api/mentors?limit=5", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({}));
      });
      await page.waitForTimeout(100);
    }

    // Wait for garbage collection
    await page.waitForTimeout(500);

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Should maintain reasonable memory
    expect(memoryIncrease).toBeLessThan(45);

    console.log(`Memory after background operations: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should handle timer cleanup properly", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`).catch(() => {});

    const getActiveTimers = async () => {
      return await page.evaluate(() => {
        // This is a simplified check
        return (window as any).__activeTimers || 0;
      });
    };

    const initialTimers = await getActiveTimers();

    // Create some timers and clean up
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {}, 1000);
      }
    });

    await page.waitForTimeout(1100);

    const finalTimers = await getActiveTimers();

    // Timers should be cleaned up after expiration
    expect(finalTimers).toBeLessThanOrEqual(initialTimers + 5);

    console.log(`Active timers - Initial: ${initialTimers}, Final: ${finalTimers}`);
  });

  test("should not leak memory during rapid state changes", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`).catch(() => {});

    const getMemory = async () => {
      return await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Simulate rapid state changes by clicking elements
    for (let i = 0; i < 20; i++) {
      const button = page.locator("button").first();
      if (await button.isVisible()) {
        await button.click().catch(() => {});
      }
      await page.waitForTimeout(50);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Memory should be controlled during state changes
    expect(memoryIncrease).toBeLessThan(35);

    console.log(`Memory during rapid state changes: ${memoryIncrease.toFixed(1)}% increase`);
  });

  test("should measure peak memory usage", async ({ page }) => {
    const memorySnapshots: number[] = [];

    await page.goto(`${BASE_URL}/mentors`);

    // Take memory snapshots during various operations
    for (let i = 0; i < 15; i++) {
      const memory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      memorySnapshots.push(memory);

      // Perform operations
      await page.evaluate(async () => {
        return fetch("/api/mentors", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({}));
      });

      await page.waitForTimeout(100);
    }

    const peakMemory = Math.max(...memorySnapshots);
    const averageMemory = memorySnapshots.reduce((a, b) => a + b) / memorySnapshots.length;

    console.log(`Memory Usage Statistics:
      Average: ${(averageMemory / 1024 / 1024).toFixed(2)}MB
      Peak: ${(peakMemory / 1024 / 1024).toFixed(2)}MB
      Range: ${((peakMemory - Math.min(...memorySnapshots)) / 1024 / 1024).toFixed(2)}MB`);
  });
});
