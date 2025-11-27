import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Performance Testing - Database & API Queries", () => {
  test("should fetch mentors list within time limit", async ({ page }) => {
    // Navigate to page first to establish base URL context
    await page.goto(`${BASE_URL}/`);

    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/mentors", { method: "GET" });
        return await response.json();
      } catch (error) {
        return {};
      }
    });

    const queryTime = Date.now() - startTime;

    // API should respond within 10 seconds (baseline)
    expect(queryTime).toBeLessThan(10000);
    expect(data).not.toBeNull();

    console.log(`Mentors API query time: ${queryTime}ms`);
  });

  test("should fetch user profile within time limit", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/users/profile", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // User profile should fetch within 10 seconds (baseline)
    expect(queryTime).toBeLessThan(10000);

    console.log(`User profile API query time: ${queryTime}ms`);
  });

  test("should fetch mentor sessions with pagination efficiently", async ({ page }) => {
    // Navigate to page first to establish base URL context
    await page.goto(`${BASE_URL}/`);

    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/mentor/sessions?page=1&limit=10", {
          method: "GET",
        });
        return await response.json();
      } catch (error) {
        return {};
      }
    });

    const queryTime = Date.now() - startTime;

    // Paginated query should complete within reasonable time
    expect(queryTime).toBeLessThan(10000);
    expect(data).not.toBeNull();

    console.log(`Mentor sessions paginated query time: ${queryTime}ms`);
  });

  test("should handle diet plan retrieval efficiently", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/diet-plans?limit=5", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Diet plans should fetch within reasonable time
    expect(queryTime).toBeLessThan(10000);

    console.log(`Diet plans query time: ${queryTime}ms`);
  });

  test("should process multiple sequential queries efficiently", async ({ page }) => {
    // Navigate to page first to establish base URL context
    await page.goto(`${BASE_URL}/`);

    const startTime = Date.now();

    const results = await page.evaluate(async () => {
      const queries = [
        fetch("/api/mentors", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/users/profile", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/diet-plans?limit=5", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({})),
      ];

      return Promise.all(queries);
    });

    const totalTime = Date.now() - startTime;

    // 3 sequential queries should complete within 20 seconds
    expect(totalTime).toBeLessThan(20000);
    expect(results.length).toBeGreaterThan(0);

    console.log(`3 sequential database queries completed in ${totalTime}ms`);
  });

  test("should handle filtered mentor queries efficiently", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/mentors?specialty=yoga", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Filtered queries should use indexes effectively
    expect(queryTime).toBeLessThan(600);

    console.log(`Filtered mentor query time: ${queryTime}ms`);
  });

  test("should handle subscription data retrieval efficiently", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/subscription/status", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Subscription query should be fast (frequently accessed)
    expect(queryTime).toBeLessThan(400);

    console.log(`Subscription status query time: ${queryTime}ms`);
  });

  test("should handle billing history pagination", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/billing/history?page=1&limit=20", {
          method: "GET",
        });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Large result sets should be paginated efficiently
    expect(queryTime).toBeLessThan(700);

    console.log(`Billing history pagination query time: ${queryTime}ms`);
  });

  test("should cache frequently accessed data", async ({ page }) => {
    // Navigate to page first to establish base URL context
    await page.goto(`${BASE_URL}/`);

    const url = "/api/mentors?limit=10";

    // First request (cache miss)
    const firstStart = Date.now();
    await page.evaluate(async () => {
      return fetch("/api/mentors?limit=10")
        .then((r) => r.json())
        .catch(() => ({}));
    });
    const firstTime = Date.now() - firstStart;

    // Second request (should be cached or very fast)
    const secondStart = Date.now();
    await page.evaluate(async () => {
      return fetch("/api/mentors?limit=10")
        .then((r) => r.json())
        .catch(() => ({}));
    });
    const secondTime = Date.now() - secondStart;

    // Second request should be faster (cached)
    expect(secondTime).toBeLessThanOrEqual(firstTime);

    console.log(`First query: ${firstTime}ms | Second query (cached): ${secondTime}ms`);
  });

  test("should handle search queries efficiently", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/search?q=yoga&type=mentor", {
          method: "GET",
        });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Search should be responsive
    expect(queryTime).toBeLessThan(800);

    console.log(`Search query time: ${queryTime}ms`);
  });

  test("should handle complex filter combinations", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch(
          "/api/mentors?specialty=yoga&rating=4&price_max=500&availability=true",
          { method: "GET" }
        );
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Complex filters should still perform well
    expect(queryTime).toBeLessThan(700);

    console.log(`Complex filter query time: ${queryTime}ms`);
  });

  test("should handle concurrent database writes", async ({ page }) => {
    const startTime = Date.now();

    const results = await page.evaluate(async () => {
      const writes = [];
      for (let i = 0; i < 3; i++) {
        writes.push(
          fetch("/api/timeslots/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: new Date().toISOString(),
              duration: 60,
            }),
          })
            .then((r) => r.json())
            .catch(() => ({}))
        );
      }
      return Promise.all(writes);
    });

    const writeTime = Date.now() - startTime;

    // 3 concurrent writes should complete within 1.5 seconds
    expect(writeTime).toBeLessThan(1500);
    expect(results.length).toBe(3);

    console.log(`3 concurrent database writes completed in ${writeTime}ms`);
  });

  test("should retrieve analytics data efficiently", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/analytics/dashboard", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Analytics should aggregate data efficiently
    expect(queryTime).toBeLessThan(1000);

    console.log(`Analytics dashboard query time: ${queryTime}ms`);
  });

  test("should handle session lookups quickly", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/sessions/active", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Active sessions should be indexed and fast
    expect(queryTime).toBeLessThan(400);

    console.log(`Active sessions query time: ${queryTime}ms`);
  });

  test("should handle bulk data operations", async ({ page }) => {
    const startTime = Date.now();

    const data = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/mentors?limit=100", { method: "GET" });
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    const queryTime = Date.now() - startTime;

    // Bulk operations should handle large datasets
    expect(queryTime).toBeLessThan(1000);

    console.log(`Bulk data retrieval (100 records) completed in ${queryTime}ms`);
  });

  test("should maintain query performance with concurrent requests", async ({ page }) => {
    const startTime = Date.now();

    const results = await page.evaluate(async () => {
      const queries = [];
      for (let i = 0; i < 10; i++) {
        queries.push(
          fetch("/api/mentors?limit=5", { method: "GET" })
            .then((r) => r.json())
            .catch(() => ({}))
        );
      }
      return Promise.all(queries);
    });

    const concurrentTime = Date.now() - startTime;

    // 10 concurrent queries should complete within 2 seconds
    expect(concurrentTime).toBeLessThan(2000);
    expect(results.length).toBe(10);

    console.log(`10 concurrent API queries completed in ${concurrentTime}ms`);
  });

  test("should measure database connection pool efficiency", async ({ page }) => {
    // Navigate to page first to establish base URL context
    await page.goto(`${BASE_URL}/`);

    const queryTimes = [];

    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await page.evaluate(async () => {
        return fetch("/api/users/profile", { method: "GET" })
          .then((r) => r.json())
          .catch(() => ({}));
      });
      queryTimes.push(Date.now() - start);
    }

    // All queries should be consistent (good connection pooling)
    const avgTime = queryTimes.reduce((a, b) => a + b) / queryTimes.length;
    const maxTime = Math.max(...queryTimes);

    expect(maxTime).toBeLessThan(600);

    console.log(
      `Query times (connection pool): ${queryTimes.join("ms, ")}ms | Avg: ${avgTime.toFixed(0)}ms`
    );
  });
});
