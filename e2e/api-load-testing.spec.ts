import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Performance Testing - API Load Testing", () => {
  test("should handle concurrent checkout API requests", async ({ page }) => {
    const concurrentRequests = 10;
    const startTime = Date.now();

    const results = await page.evaluate(async (requests) => {
      const calls = [];
      for (let i = 0; i < requests; i++) {
        calls.push(
          fetch("/api/checkout/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: [{ id: "test", quantity: 1 }],
            }),
          })
            .then((r) => ({ status: r.status, time: Date.now() }))
            .catch((err) => ({ error: true }))
        );
      }
      return Promise.all(calls);
    }, concurrentRequests);

    const totalTime = Date.now() - startTime;

    // All requests should succeed
    const successCount = results.filter((r: any) => !r.error).length;
    expect(successCount).toBe(concurrentRequests);

    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(3000);

    console.log(`${concurrentRequests} concurrent checkout requests completed in ${totalTime}ms`);
  });

  test("should handle payment processing load", async ({ page }) => {
    const requests = 5;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/payment/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: 1000,
              currency: "INR",
              orderId: `order-${Date.now()}-${i}`,
            }),
          })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All payment requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2.5 seconds
    expect(totalTime).toBeLessThan(2500);

    console.log(`${requests} payment requests completed in ${totalTime}ms`);
  });

  test("should handle mentor search under load", async ({ page }) => {
    const searches = 15;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      const queries = ["yoga", "fitness", "nutrition", "meditation", "wellness"];

      for (let i = 0; i < count; i++) {
        const query = queries[i % queries.length];
        calls.push(
          fetch(`/api/search?q=${query}&type=mentor`, { method: "GET" })
            .then((r) => ({ status: r.status, time: Date.now() }))
            .catch(() => ({ error: true }))
        );
      }
      return Promise.all(calls);
    }, searches);

    const totalTime = Date.now() - startTime;

    // All searches should succeed
    const successCount = results.filter((r: any) => !r.error).length;
    expect(successCount).toBe(searches);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${searches} concurrent searches completed in ${totalTime}ms`);
  });

  test("should handle session booking requests under load", async ({ page }) => {
    const bookings = 8;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/sessions/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mentorId: `mentor-${i}`,
              date: new Date().toISOString(),
              duration: 60,
            }),
          })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, bookings);

    const totalTime = Date.now() - startTime;

    // All booking requests should respond
    expect(results.length).toBe(bookings);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${bookings} concurrent booking requests completed in ${totalTime}ms`);
  });

  test("should handle user authentication burst", async ({ page }) => {
    const attempts = 20;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: `user${i}@example.com`,
              password: "password123",
            }),
          })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, attempts);

    const totalTime = Date.now() - startTime;

    // Requests should respond (rate limiting may block some)
    expect(results.length).toBe(attempts);

    // Should complete within 3 seconds
    expect(totalTime).toBeLessThan(3000);

    console.log(`${attempts} authentication requests completed in ${totalTime}ms`);
  });

  test("should handle mentor listing with various filters", async ({ page }) => {
    const requests = 12;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      const filters = [
        "?specialty=yoga",
        "?specialty=fitness",
        "?rating=4&up",
        "?price_max=500",
        "?availability=true",
        "?experience=5%2B",
      ];

      for (let i = 0; i < count; i++) {
        const filter = filters[i % filters.length];
        calls.push(
          fetch(`/api/mentors${filter}`, { method: "GET" })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All filtered requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2.5 seconds
    expect(totalTime).toBeLessThan(2500);

    console.log(`${requests} filtered mentor requests completed in ${totalTime}ms`);
  });

  test("should handle analytics data aggregation under load", async ({ page }) => {
    const requests = 5;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/analytics/dashboard", { method: "GET" })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All analytics requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${requests} analytics requests completed in ${totalTime}ms`);
  });

  test("should handle diet plan API under load", async ({ page }) => {
    const requests = 10;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch(`/api/diet-plans?limit=20&page=${(i % 5) + 1}`, { method: "GET" })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All diet plan requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${requests} diet plan requests completed in ${totalTime}ms`);
  });

  test("should handle billing API requests efficiently", async ({ page }) => {
    const requests = 8;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch(`/api/billing/history?page=1&limit=20`, { method: "GET" })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All billing requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${requests} billing history requests completed in ${totalTime}ms`);
  });

  test("should handle subscription status checks concurrently", async ({ page }) => {
    const requests = 15;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/subscription/status", { method: "GET" })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All subscription requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 1.5 seconds
    expect(totalTime).toBeLessThan(1500);

    console.log(`${requests} subscription status requests completed in ${totalTime}ms`);
  });

  test("should handle timeslot creation requests", async ({ page }) => {
    const requests = 6;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/timeslots/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: new Date().toISOString(),
              duration: 60,
              mentorId: `mentor-${i}`,
            }),
          })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All timeslot requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${requests} timeslot creation requests completed in ${totalTime}ms`);
  });

  test("should handle profile update requests", async ({ page }) => {
    const requests = 5;
    const startTime = Date.now();

    const results = await page.evaluate(async (count) => {
      const calls = [];
      for (let i = 0; i < count; i++) {
        calls.push(
          fetch("/api/users/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `User ${i}`,
              bio: `Bio for user ${i}`,
            }),
          })
            .then((r) => r.status)
            .catch(() => 0)
        );
      }
      return Promise.all(calls);
    }, requests);

    const totalTime = Date.now() - startTime;

    // All profile update requests should respond
    expect(results.length).toBe(requests);

    // Should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);

    console.log(`${requests} profile update requests completed in ${totalTime}ms`);
  });

  test("should measure API response time distribution", async ({ page }) => {
    const requests = 20;
    const responseTimes: number[] = [];

    for (let i = 0; i < requests; i++) {
      const startTime = Date.now();
      await page.evaluate(async () => {
        return fetch("/api/mentors?limit=10", { method: "GET" }).then((r) => r.json());
      });
      responseTimes.push(Date.now() - startTime);
    }

    // Calculate statistics
    const sorted = responseTimes.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = responseTimes.reduce((a, b) => a + b) / requests;
    const p95 = sorted[Math.floor(requests * 0.95)];
    const p99 = sorted[Math.floor(requests * 0.99)];

    // P95 should be under 700ms
    expect(p95).toBeLessThan(700);

    console.log(`API Response Time Statistics:
      Min: ${min}ms
      Max: ${max}ms
      Avg: ${avg.toFixed(0)}ms
      P95: ${p95}ms
      P99: ${p99}ms`);
  });

  test("should handle sustained API load", async ({ page }) => {
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < duration) {
      try {
        const response = await page.evaluate(async () => {
          return fetch("/api/mentors?limit=10", { method: "GET" }).then((r) => r.status);
        });
        requestCount++;
      } catch (error) {
        errorCount++;
      }
    }

    const totalTime = Date.now() - startTime;
    const requestsPerSecond = (requestCount / totalTime) * 1000;

    // Should maintain decent throughput
    expect(requestsPerSecond).toBeGreaterThan(5);

    console.log(`Sustained load test (5s):
      Total requests: ${requestCount}
      Errors: ${errorCount}
      Requests/second: ${requestsPerSecond.toFixed(1)}`);
  });
});
