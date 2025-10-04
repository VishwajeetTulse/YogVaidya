const axios = require("axios");

// Test POST endpoints for session operations
async function testSessionPostEndpoints() {
  const baseUrl = "http://localhost:3000";

  console.log("=== Testing Session POST Endpoints ===\n");

  // Test data - using actual session IDs from the database
  const testSessions = [
    "booking_1758358728990_88ud6d0hp", // SCHEDULED YOGA session
    "booking_1758358728948_3e23nm4qr", // SCHEDULED YOGA session
    "booking_1758358728903_hujd9x5gl", // SCHEDULED YOGA session
  ];

  for (const sessionId of testSessions) {
    console.log(`\n--- Testing Session: ${sessionId} ---`);

    try {
      // Test 1: Start Session (POST)
      console.log("1. Testing POST /api/sessions/[sessionId]/start");
      try {
        const startResponse = await axios.post(`${baseUrl}/api/sessions/${sessionId}/start`);
        console.log("✅ Start Session Response:", JSON.stringify(startResponse.data, null, 2));
      } catch (error) {
        console.log("❌ Start Session Error:", error.response?.data || error.message);
      }

      // Wait a moment before completing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test 2: Complete Session (POST)
      console.log("2. Testing POST /api/sessions/[sessionId]/complete");
      try {
        const completeResponse = await axios.post(`${baseUrl}/api/sessions/${sessionId}/complete`);
        console.log(
          "✅ Complete Session Response:",
          JSON.stringify(completeResponse.data, null, 2)
        );
      } catch (error) {
        console.log("❌ Complete Session Error:", error.response?.data || error.message);
      }
    } catch (error) {
      console.log("❌ General Error:", error.message);
    }
  }

  console.log("\n=== Test Complete ===");
}

// Run the test
testSessionPostEndpoints().catch(console.error);
