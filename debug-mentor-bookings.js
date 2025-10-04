const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugMentorBookings() {
  try {
    const userId = "1MFFx3Xfe2eWJNuh7soTQZ8BVbnzXz6e";

    console.log("🔍 Debugging mentor bookings for user:", userId);

    // Check all session bookings for this user
    const allBookings = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: userId,
          },
        },
      ],
      cursor: {},
    });

    let bookings = [];
    if (
      allBookings &&
      typeof allBookings === "object" &&
      "cursor" in allBookings &&
      allBookings.cursor &&
      typeof allBookings.cursor === "object" &&
      "firstBatch" in allBookings.cursor &&
      Array.isArray(allBookings.cursor.firstBatch)
    ) {
      bookings = allBookings.cursor.firstBatch;
    }

    console.log(`📊 Total bookings found: ${bookings.length}`);

    if (bookings.length > 0) {
      console.log("📋 First booking details:");
      console.log(JSON.stringify(bookings[0], null, 2));

      // Check each booking
      bookings.forEach((booking, index) => {
        console.log(`\n📋 Booking ${index + 1}:`);
        console.log(`- ID: ${booking._id}`);
        console.log(`- User ID: ${booking.userId}`);
        console.log(`- Mentor ID: ${booking.mentorId}`);
        console.log(`- TimeSlot ID: ${booking.timeSlotId}`);
        console.log(`- Payment Status: ${booking.paymentStatus}`);
        console.log(`- Scheduled At: ${booking.scheduledAt}`);
        console.log(`- Status: ${booking.status}`);
      });
    }

    // Now try the aggregation with mentor lookup
    console.log("\n🔍 Testing aggregation with mentor lookup...");

    const mentorBookings = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: userId,
            paymentStatus: "COMPLETED",
            scheduledAt: { $exists: true },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "mentorId",
            foreignField: "_id",
            as: "mentor",
          },
        },
        {
          $addFields: {
            mentorData: { $arrayElemAt: ["$mentor", 0] },
          },
        },
      ],
      cursor: {},
    });

    let mentorResults = [];
    if (
      mentorBookings &&
      typeof mentorBookings === "object" &&
      "cursor" in mentorBookings &&
      mentorBookings.cursor &&
      typeof mentorBookings.cursor === "object" &&
      "firstBatch" in mentorBookings.cursor &&
      Array.isArray(mentorBookings.cursor.firstBatch)
    ) {
      mentorResults = mentorBookings.cursor.firstBatch;
    }

    console.log(`📊 Mentor lookup results: ${mentorResults.length}`);
    if (mentorResults.length > 0) {
      console.log("📋 First mentor result:");
      console.log(JSON.stringify(mentorResults[0], null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMentorBookings();
