import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { AuthenticationError, NotFoundError, AuthorizationError } from "@/lib/utils/error-handler";
import { sendEmail } from "@/lib/services/email";
import { sessionCancelledTemplate } from "@/lib/services/email-templates";

const cancelSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().optional(),
});

// Interface for session booking data
interface SessionBookingData {
  _id?: string;
  userId?: string;
  mentorId?: string;
  sessionType?: string;
  scheduledAt?: string | Date;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();
    const { sessionId, reason } = cancelSessionSchema.parse(body);

    // Get the session booking
    const bookingResult = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: { _id: sessionId },
    });

    let booking: Prisma.JsonObject | null = null;
    if (
      bookingResult &&
      typeof bookingResult === "object" &&
      "cursor" in bookingResult &&
      bookingResult.cursor &&
      typeof bookingResult.cursor === "object" &&
      "firstBatch" in bookingResult.cursor &&
      Array.isArray(bookingResult.cursor.firstBatch) &&
      bookingResult.cursor.firstBatch.length > 0
    ) {
      booking = bookingResult.cursor.firstBatch[0] as Prisma.JsonObject;
    }

    if (!booking) {
      throw new NotFoundError("Session booking not found");
    }

    const bookingData = booking as unknown as SessionBookingData;

    // Check if user is authorized to cancel (student or mentor of this session)
    const isStudent = bookingData.userId === session.user.id;
    const isMentor = bookingData.mentorId === session.user.id;

    if (!isStudent && !isMentor) {
      throw new AuthorizationError("You are not authorized to cancel this session");
    }

    // Check if session can be cancelled (only SCHEDULED sessions)
    if (bookingData.status !== "SCHEDULED") {
      return NextResponse.json(
        { success: false, error: "Only scheduled sessions can be cancelled" },
        { status: 400 }
      );
    }

    // Update session status to CANCELLED
    const { createDateUpdate } = await import("@/lib/utils/date-utils");

    await prisma.$runCommandRaw({
      update: "sessionBooking",
      updates: [
        {
          q: { _id: sessionId },
          u: {
            $set: {
              status: "CANCELLED",
              cancellationReason: reason || "Cancelled by user",
              cancelledBy: session.user.id,
              cancelledAt: new Date().toISOString(),
              ...(createDateUpdate({}) as object),
            },
          },
        },
      ],
    });

    // If session was booked via time slot, decrement the student count
    if (booking.timeSlotId) {
      await prisma.$runCommandRaw({
        update: "mentorTimeSlot",
        updates: [
          {
            q: { _id: booking.timeSlotId },
            u: {
              $inc: { currentStudents: -1 },
              $set: createDateUpdate({}) as Prisma.InputJsonValue,
            },
          },
        ],
      });
    }

    // Get student and mentor details for emails
    const student = await prisma.user.findUnique({
      where: { id: bookingData.userId as string },
      select: { name: true, email: true },
    });

    const mentor = await prisma.user.findUnique({
      where: { id: bookingData.mentorId as string },
      select: { name: true, email: true },
    });

    // Determine who cancelled
    const cancelledBy = isStudent ? (student?.name || "Student") : (mentor?.name || "Mentor");
    const sessionDate = new Date(bookingData.scheduledAt as string);

    // Send cancellation emails to both parties
    try {
      // Send to student (if mentor cancelled)
      if (!isStudent && student?.email) {
        const studentEmail = sessionCancelledTemplate(
          student.name || "there",
          bookingData.sessionType || "Session",
          sessionDate,
          cancelledBy,
          reason
        );
        await sendEmail({
          to: student.email,
          subject: studentEmail.subject,
          text: studentEmail.html,
          html: true,
        });
      }

      // Send to mentor (if student cancelled)
      if (!isMentor && mentor?.email) {
        const mentorEmail = sessionCancelledTemplate(
          mentor.name || "Mentor",
          bookingData.sessionType || "Session",
          sessionDate,
          cancelledBy,
          reason
        );
        await sendEmail({
          to: mentor.email,
          subject: mentorEmail.subject,
          text: mentorEmail.html,
          html: true,
        });
      }

      // Also send confirmation to the canceller
      if (isStudent && student?.email) {
        const confirmEmail = sessionCancelledTemplate(
          student.name || "there",
          bookingData.sessionType || "Session",
          sessionDate,
          "You",
          reason
        );
        await sendEmail({
          to: student.email,
          subject: confirmEmail.subject,
          text: confirmEmail.html,
          html: true,
        });
      } else if (isMentor && mentor?.email) {
        const confirmEmail = sessionCancelledTemplate(
          mentor.name || "Mentor",
          bookingData.sessionType || "Session",
          sessionDate,
          "You",
          reason
        );
        await sendEmail({
          to: mentor.email,
          subject: confirmEmail.subject,
          text: confirmEmail.html,
          html: true,
        });
      }
    } catch (emailError) {
      console.error("Failed to send session cancellation emails:", emailError);
      // Don't throw - cancellation was successful
    }

    return NextResponse.json({
      success: true,
      message: "Session cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: "Failed to cancel session" },
      { status: 500 }
    );
  }
}
