const axios = require("axios");

// Comprehensive test for datetime conversion fixes
async function testDatetimeConversions() {
  console.log("=== Testing Datetime Conversion Fixes ===\n");

  try {
    // Test 1: Debug endpoint datetime serialization
    console.log("1. Testing debug endpoint datetime serialization...");
    const debugResponse = await axios.get("http://localhost:3000/api/debug/sessions");
    if (debugResponse.data.success) {
      console.log("✅ Debug endpoint returns proper datetime strings");

      const sessions = debugResponse.data.debug.recentSessions;
      if (sessions.length > 0) {
        const session = sessions[0];
        if (typeof session.scheduled === "string" && typeof session.created === "string") {
          console.log("✅ Datetime fields are properly serialized as strings");
        } else {
          console.log("❌ Datetime fields are not properly serialized");
        }
      }
    } else {
      console.log("❌ Debug endpoint failed");
    }

    // Test 2: Session start with time slot datetime conversion
    console.log("\n2. Testing session start datetime conversion...");
    const sessions = debugResponse.data.debug.recentSessions;
    const scheduledSession = sessions.find((s) => s.status === "SCHEDULED");

    if (scheduledSession) {
      const startResponse = await axios.post(
        `http://localhost:3000/api/sessions/${scheduledSession.id}/start`
      );
      if (startResponse.data.success) {
        console.log("✅ Session start works with datetime conversion");
      } else {
        console.log("❌ Session start failed:", startResponse.data.error);
      }
    } else {
      console.log("⚠️ No scheduled sessions available for testing");
    }

    // Test 3: Session complete
    console.log("\n3. Testing session complete...");
    const ongoingSession = sessions.find((s) => s.status === "ONGOING");
    if (ongoingSession) {
      const completeResponse = await axios.post(
        `http://localhost:3000/api/sessions/${ongoingSession.id}/complete`
      );
      if (completeResponse.data.success) {
        console.log("✅ Session complete works correctly");
      } else {
        console.log("❌ Session complete failed:", completeResponse.data.error);
      }
    } else {
      console.log("⚠️ No ongoing sessions available for testing");
    }

    // Test 4: Error handling for invalid dates
    console.log("\n4. Testing error handling...");
    try {
      await axios.post("http://localhost:3000/api/sessions/invalid_session_id/start");
    } catch (error) {
      if (error.response?.data?.error === "Session not found in any collection") {
        console.log("✅ Proper error handling for invalid session IDs");
      } else {
        console.log("❌ Unexpected error response:", error.response?.data);
      }
    }

    console.log("\n=== All Datetime Conversion Tests Complete ===");
  } catch (error) {
    console.log("❌ Test failed with error:", error.message);
  }
}

// Run the comprehensive test
testDatetimeConversions().catch(console.error);
