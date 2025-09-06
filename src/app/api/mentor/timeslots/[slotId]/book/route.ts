import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("🚀 Booking time slot:", resolvedParams.slotId);
    
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { notes } = body;
    
    const { prisma } = await import("@/lib/config/prisma");
    
    // Get the time slot details
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {
        _id: resolvedParams.slotId,
        isActive: true,
        $expr: { $lt: ['$currentStudents', '$maxStudents'] }
      }
    });

    let timeSlot: any = null;
    if (timeSlotResult && 
        typeof timeSlotResult === 'object' && 
        'cursor' in timeSlotResult &&
        timeSlotResult.cursor &&
        typeof timeSlotResult.cursor === 'object' &&
        'firstBatch' in timeSlotResult.cursor &&
        Array.isArray(timeSlotResult.cursor.firstBatch) &&
        timeSlotResult.cursor.firstBatch.length > 0) {
      timeSlot = timeSlotResult.cursor.firstBatch[0];
    }

    if (!timeSlot) {
      console.log("❌ Time slot not found or fully booked");
      return NextResponse.json(
        { success: false, error: "Time slot not available or fully booked" },
        { status: 404 }
      );
    }

    // Additional check: Count pending bookings for this time slot
    const pendingBookingsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        timeSlotId: resolvedParams.slotId,
        status: { $in: ["SCHEDULED", "ONGOING"] },
        $or: [
          { paymentStatus: "COMPLETED" },
          { paymentStatus: "PENDING" }
        ]
      }
    });

    let pendingBookingsCount = 0;
    if (pendingBookingsResult && 
        typeof pendingBookingsResult === 'object' && 
        'cursor' in pendingBookingsResult &&
        pendingBookingsResult.cursor &&
        typeof pendingBookingsResult.cursor === 'object' &&
        'firstBatch' in pendingBookingsResult.cursor &&
        Array.isArray(pendingBookingsResult.cursor.firstBatch)) {
      pendingBookingsCount = pendingBookingsResult.cursor.firstBatch.length;
    }

    const totalBooked = (timeSlot.currentStudents || 0) + pendingBookingsCount;
    if (totalBooked >= timeSlot.maxStudents) {
      console.log("❌ Time slot fully booked including pending bookings", {
        currentStudents: timeSlot.currentStudents,
        pendingBookings: pendingBookingsCount,
        maxStudents: timeSlot.maxStudents,
        totalBooked
      });
      return NextResponse.json(
        { success: false, error: "Time slot is fully booked" },
        { status: 409 }
      );
    }

    // Create the session booking
    const bookingId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$runCommandRaw({
      insert: 'sessionBooking',
      documents: [{
        _id: bookingId,
        userId: session.user.id,
        mentorId: timeSlot.mentorId,
        timeSlotId: resolvedParams.slotId,
        sessionType: timeSlot.sessionType,
        scheduledAt: new Date(timeSlot.startTime),
        status: "SCHEDULED",
        notes: notes || "",
        paymentStatus: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDelayed: false
      }]
    });
    
    console.log("📋 Session booking created with ID:", bookingId);
    
    // Return the expected response structure that matches the client expectations
    return NextResponse.json({
      success: true,
      data: {
        bookingId: bookingId,
        timeSlot: {
          id: resolvedParams.slotId,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
        },
        mentor: {
          id: timeSlot.mentorId,
          name: timeSlot.mentorName || "Mentor",
          mentorType: timeSlot.sessionType + "MENTOR",
        },
        scheduledAt: timeSlot.startTime,
        amount: timeSlot.price || 1500,
        status: "SCHEDULED",
        notes: notes || "",
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
      method: "DELETE"
    });

  } catch (error) {
    console.error("Error cancelling booking:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}