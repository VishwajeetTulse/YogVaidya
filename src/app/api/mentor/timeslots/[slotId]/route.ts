import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

// GET /api/mentor/timeslots/[slotId] - Get a specific time slot (public access for booking)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("🔍 Fetching time slot for booking:", resolvedParams.slotId);
    
    const { prisma } = await import("@/lib/config/prisma");

    // Get the time slot with mentor details (public access for booking)
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {
        _id: resolvedParams.slotId,
        isActive: true
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
      return NextResponse.json(
        { success: false, error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Get mentor details
    const mentor = await prisma.user.findFirst({
      where: {
        id: timeSlot.mentorId,
        role: "MENTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        sessionPrice: true,
        mentorType: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    console.log("✅ Time slot found with mentor details");

    return NextResponse.json({
      success: true,
      data: {
        _id: timeSlot._id,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        sessionType: timeSlot.sessionType,
        maxStudents: timeSlot.maxStudents,
        currentStudents: timeSlot.currentStudents,
        isBooked: timeSlot.isBooked,
        price: timeSlot.price,
        notes: timeSlot.notes,
        sessionLink: timeSlot.sessionLink,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          image: mentor.image,
          mentorType: mentor.mentorType,
          sessionPrice: mentor.sessionPrice,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching time slot:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch time slot" },
      { status: 500 }
    );
  }
}

// DELETE /api/mentor/timeslots/[slotId] - Delete a time slot
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("🗑️ Deleting time slot:", resolvedParams.slotId);
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { prisma } = await import("@/lib/config/prisma");

    // First, check if the time slot exists and belongs to this mentor
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {
        _id: resolvedParams.slotId,
        mentorId: session.user.id
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
      return NextResponse.json(
        { success: false, error: "Time slot not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Check if the time slot is booked
    if (timeSlot.isBooked) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a booked time slot. Please cancel bookings first." },
        { status: 400 }
      );
    }

    // Delete the time slot
    await prisma.$runCommandRaw({
      delete: 'mentorTimeSlot',
      deletes: [{
        q: { _id: resolvedParams.slotId },
        limit: 1
      }]
    });

    console.log("✅ Time slot deleted successfully");

    return NextResponse.json({
      success: true,
      data: {
        message: "Time slot deleted successfully",
        slotId: resolvedParams.slotId,
      },
    });

  } catch (error) {
    console.error("Error deleting time slot:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to delete time slot" },
      { status: 500 }
    );
  }
}

// PUT /api/mentor/timeslots/[slotId] - Update a time slot
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("✏️ Updating time slot:", resolvedParams.slotId);
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      startTime, 
      endTime, 
      sessionType, 
      maxStudents, 
      isRecurring, 
      recurringDays, 
      sessionLink,
      notes 
    } = body;

    const { prisma } = await import("@/lib/config/prisma");

    // First, check if the time slot exists and belongs to this mentor
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {
        _id: resolvedParams.slotId,
        mentorId: session.user.id
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
      return NextResponse.json(
        { success: false, error: "Time slot not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Check if the time slot is booked and prevent certain changes
    if (timeSlot.isBooked) {
      return NextResponse.json(
        { success: false, error: "Cannot modify a booked time slot. Please cancel bookings first." },
        { status: 400 }
      );
    }

    // Update the time slot
    const updateData = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      sessionType,
      maxStudents: parseInt(maxStudents),
      isRecurring: Boolean(isRecurring),
      recurringDays: recurringDays || [],
      sessionLink: sessionLink,
      notes: notes || "",
      updatedAt: new Date()
    };

    await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [{
        q: { _id: resolvedParams.slotId },
        u: { $set: updateData }
      }]
    });

    console.log("✅ Time slot updated successfully");

    return NextResponse.json({
      success: true,
      data: {
        message: "Time slot updated successfully",
        slotId: resolvedParams.slotId,
      },
    });

  } catch (error) {
    console.error("Error updating time slot:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to update time slot" },
      { status: 500 }
    );
  }
}
