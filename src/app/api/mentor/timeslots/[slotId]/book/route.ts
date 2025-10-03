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
    
    // Try Prisma first, with explicit DateTime conversion fallback
    let timeSlot: any = null;
    
    try {
      // Attempt normal Prisma query
      timeSlot = await prisma.mentorTimeSlot.findFirst({
        where: {
          id: resolvedParams.slotId,
          isActive: true
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error: any) {
      // If DateTime conversion fails, fall back to raw query
      if (error.code === 'P2023' && error.message.includes('DateTime')) {
        console.warn("🔧 DateTime conversion failed, using raw query fallback");
        
        const timeSlotResult = await prisma.$runCommandRaw({
          find: 'mentorTimeSlot',
          filter: {
            _id: resolvedParams.slotId,
            isActive: true
          }
        });

        if (timeSlotResult && 
            typeof timeSlotResult === 'object' && 
            'cursor' in timeSlotResult &&
            timeSlotResult.cursor &&
            typeof timeSlotResult.cursor === 'object' &&
            'firstBatch' in timeSlotResult.cursor &&
            Array.isArray(timeSlotResult.cursor.firstBatch) &&
            timeSlotResult.cursor.firstBatch.length > 0) {
          
          const rawSlot = timeSlotResult.cursor.firstBatch[0] as any;
          
          // Convert MongoDB _id to id for compatibility
          rawSlot.id = rawSlot._id;
          
          // Convert string dates to proper Date objects for consistency
          const dateFields = ['startTime', 'endTime', 'createdAt', 'updatedAt'];
          for (const field of dateFields) {
            if (rawSlot[field]) {
              if (typeof rawSlot[field] === 'string') {
                rawSlot[field] = new Date(rawSlot[field]);
              } else if (typeof rawSlot[field] === 'object' && rawSlot[field].$date) {
                rawSlot[field] = new Date(rawSlot[field].$date);
              }
            }
          }
          
          // Get mentor details separately
          const mentor = await prisma.user.findFirst({
            where: {
              id: rawSlot.mentorId,
              role: "MENTOR"
            },
            select: {
              id: true,
              name: true
            }
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
      return NextResponse.json(
        { success: false, error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (!timeSlot.mentor) {
      console.log("❌ Mentor not found for this time slot");
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
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

    // Additional check: Count pending bookings for this time slot using Prisma
    const pendingBookingsCount = await prisma.sessionBooking.count({
      where: {
        timeSlotId: resolvedParams.slotId,
        status: { in: ["SCHEDULED", "ONGOING"] },
        OR: [
          { paymentStatus: "COMPLETED" },
          { paymentStatus: "PENDING" }
        ]
      }
    });

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

    // Create the session booking using Prisma to ensure proper date handling
    const bookingId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate duration from timeSlot
    const sessionDuration = Math.round(
      (timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) / (1000 * 60)
    );
    
    const booking = await prisma.sessionBooking.create({
      data: {
        id: bookingId,
        userId: session.user.id,
        mentorId: timeSlot.mentorId,
        timeSlotId: resolvedParams.slotId,
        sessionType: timeSlot.sessionType,
        scheduledAt: new Date(timeSlot.startTime),
        duration: sessionDuration,
        status: "SCHEDULED",
        notes: notes || "",
        paymentStatus: "PENDING"
      }
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
          name: timeSlot.mentor?.name || "Mentor",
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