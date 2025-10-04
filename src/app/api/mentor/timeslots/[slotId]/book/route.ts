import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function POST(request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const resolvedParams = await params;
    console.log("🚀 Booking time slot:", resolvedParams.slotId);

    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notes } = body;

    const { prisma } = await import("@/lib/config/prisma");

    // Try Prisma first, with explicit DateTime conversion fallback
    let timeSlot: any = null;

    try {
      // Attempt normal Prisma query
      timeSlot = await prisma.mentorTimeSlot.findFirst({
        where: {
          id: resolvedParams.slotId,
          isActive: true,
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      // If DateTime conversion fails, fall back to raw query
      if (error.code === "P2023" && error.message.includes("DateTime")) {
        console.warn("🔧 DateTime conversion failed, using raw query fallback");

        const timeSlotResult = await prisma.$runCommandRaw({
          find: "mentorTimeSlot",
          filter: {
            _id: resolvedParams.slotId,
            isActive: true,
          },
        });

        if (
          timeSlotResult &&
          typeof timeSlotResult === "object" &&
          "cursor" in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === "object" &&
          "firstBatch" in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0
        ) {
          const rawSlot = timeSlotResult.cursor.firstBatch[0] as any;

          // Convert MongoDB _id to id for compatibility
          rawSlot.id = rawSlot._id;

          // Convert string dates to proper Date objects for consistency
          const dateFields = ["startTime", "endTime", "createdAt", "updatedAt"];
          for (const field of dateFields) {
            if (rawSlot[field]) {
              if (typeof rawSlot[field] === "string") {
                rawSlot[field] = new Date(rawSlot[field]);
              } else if (typeof rawSlot[field] === "object" && rawSlot[field].$date) {
                rawSlot[field] = new Date(rawSlot[field].$date);
              }
            }
          }

          // Get mentor details separately
          const mentor = await prisma.user.findFirst({
            where: {
              id: rawSlot.mentorId,
              role: "MENTOR",
            },
            select: {
              id: true,
              name: true,
            },
          });

          if (mentor) {
            rawSlot.mentor = mentor;
          }

          timeSlot = rawSlot;
        }
      } else {
        throw error; // Re-throw non-DateTime errors
      }
    }

    if (!timeSlot) {
      console.log("❌ Time slot not found");
      return NextResponse.json({ success: false, error: "Time slot not found" }, { status: 404 });
    }

    if (!timeSlot.mentor) {
      console.log("❌ Mentor not found for this time slot");
      return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
    }

    // Check if slot has capacity
    if (timeSlot && timeSlot.currentStudents >= timeSlot.maxStudents) {
      console.log("❌ Time slot fully booked by capacity check");
      return NextResponse.json(
        { success: false, error: "Time slot is fully booked" },
        { status: 409 }
      );
    }

    if (!timeSlot) {
      console.log("❌ Time slot not found or fully booked");
      return NextResponse.json(
        { success: false, error: "Time slot not available or fully booked" },
        { status: 404 }
      );
    }

    // Additional check: Count COMPLETED payment bookings for this time slot using Prisma
    // NOTE: We only count COMPLETED payments to avoid blocking when user cancels payment
    const confirmedBookingsCount = await prisma.sessionBooking.count({
      where: {
        timeSlotId: resolvedParams.slotId,
        status: { in: ["SCHEDULED", "ONGOING"] },
        paymentStatus: "COMPLETED",
      },
    });

    const totalBooked = (timeSlot.currentStudents || 0) + confirmedBookingsCount;
    if (totalBooked >= timeSlot.maxStudents) {
      console.log("❌ Time slot fully booked", {
        currentStudents: timeSlot.currentStudents,
        confirmedBookings: confirmedBookingsCount,
        maxStudents: timeSlot.maxStudents,
        totalBooked,
      });
      return NextResponse.json(
        { success: false, error: "Time slot is fully booked" },
        { status: 409 }
      );
    }

    // DON'T create session booking yet - only create booking data to return
    // The actual SessionBooking will be created after payment is verified
    const bookingId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate duration from timeSlot
    const sessionDuration = Math.round(
      (timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) / (1000 * 60)
    );

    console.log("📋 Prepared booking data with ID:", bookingId, "(not saved to DB yet)");

    // Return the booking data for payment processing
    // NOTE: No database record is created yet - it will be created after payment verification
    return NextResponse.json({
      success: true,
      data: {
        bookingId: bookingId,
        userId: session.user.id,
        mentorId: timeSlot.mentorId,
        timeSlotId: resolvedParams.slotId,
        sessionType: timeSlot.sessionType,
        scheduledAt: timeSlot.startTime,
        duration: sessionDuration,
        notes: notes || "",
        timeSlot: {
          id: resolvedParams.slotId,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
        },
        mentor: {
          id: timeSlot.mentorId,
          name: timeSlot.mentor?.name || "Mentor",
          mentorType: timeSlot.sessionType + "MENTOR",
        },
        amount: timeSlot.price || 1500,
        status: "PENDING_PAYMENT",
      },
    });
  } catch (error) {
    console.error("Error in booking endpoint:", error);

    return NextResponse.json(
      { success: false, error: "Failed to process booking request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("🗑️ Cancelling time slot booking:", resolvedParams.slotId);

    return NextResponse.json({
      success: true,
      message: "Cancel booking endpoint is working!",
      slotId: resolvedParams.slotId,
      timestamp: new Date().toISOString(),
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);

    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
