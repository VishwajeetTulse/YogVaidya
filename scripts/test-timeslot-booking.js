// Test script to create a time slot with maxStudents > 1 for testing overbooking prevention
console.log("Creating test time slot with maxStudents: 2");

async function createTestTimeSlot() {
  const response = await fetch("http://localhost:3000/api/mentor/timeslots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "session=your_session_here" // Would need actual session
    },
    body: JSON.stringify({
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      sessionType: "YOGA",
      maxStudents: 2, // Group session with 2 max students
      isRecurring: false,
      sessionLink: "https://zoom.us/test-group-session",
      notes: "Test group session for overbooking prevention",
    }),
  });

  const result = await response.json();
  console.log("Test time slot creation result:", result);
}

// Note: This script needs proper authentication to work
// createTestTimeSlot().catch(console.error);

console.log("Test script ready - needs authentication to run");
