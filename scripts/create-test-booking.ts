// Test script to create a sample session booking for testing
import { prisma } from "@/lib/config/prisma";

async function createTestSessionBooking() {
  const mentorId = "p27belqfkUe1sppnuFpG4nSupFZj8Fme"; // From the logs
  const userId = "test-student-id"; // We'll create a test student

  // Create a test student user
  const testStudent = {
    _id: userId,
    id: userId,
    email: "test.student@example.com",
    name: "Test Student",
    role: "USER",
    phone: "+1234567890",
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true,
    isAvailable: true,
    subscriptionStatus: "ACTIVE",
    isTrialActive: false,
    trialUsed: false,
  };

  // Insert test student
  await prisma.$runCommandRaw({
    insert: 'user',
    documents: [testStudent]
  });

  // Create a test session booking
  const testBooking = {
    _id: `booking_${Date.now()}_test`,
    id: `booking_${Date.now()}_test`,
    userId: userId,
    mentorId: mentorId,
    timeSlotId: "test-timeslot-id",
    sessionType: "YOGA",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: "SCHEDULED",
    isDelayed: false,
    notes: "Test booking for mentor dashboard",
    paymentDetails: {
      paymentId: "test_payment_123",
      orderId: "test_order_123",
      amount: 500,
      currency: "INR",
    },
    amount: 500,
    paymentStatus: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Insert test booking
  await prisma.$runCommandRaw({
    insert: 'sessionBooking',
    documents: [testBooking]
  });

  console.log("✅ Test session booking created successfully!");
  console.log("📋 Booking details:", testBooking);
}

// Run the script
createTestSessionBooking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating test booking:", error);
    process.exit(1);
  });
