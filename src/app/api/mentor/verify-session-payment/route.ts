import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";
import { invalidateBillingHistoryCache } from "@/lib/actions/billing-actions";

import { AuthenticationError, NotFoundError, ConflictError } from "@/lib/utils/error-handler";
import { successResponse, errorResponse } from "@/lib/utils/response-handler";
import { sendEmail } from "@/lib/services/email";
import { sessionBookedTemplate, sessionBookedMentorTemplate } from "@/lib/services/email-templates";

const verifySessionPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  mentorId: z.string(),
  sessionDate: z.string(),
  sessionTime: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mentorId,
      sessionDate,
      sessionTime,
      notes,
    } = verifySessionPaymentSchema.parse(body);

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      throw new ConflictError("Payment verification failed");
    }

    // Payment verified, create session booking in database
    const { prisma } = await import("@/lib/config/prisma");

    // First, get mentor details
    const mentor = await prisma.user.findFirst({
      where: {
        id: mentorId,
        role: "MENTOR",
      },
      select: {
        id: true,
        name: true,
        sessionPrice: true,
        mentorType: true,
      },
    });

    if (!mentor) {
      throw new NotFoundError("Mentor not found");
    }

    // Map MentorType to SessionType
    const getSessionType = (mentorType: string | null): "YOGA" | "MEDITATION" | "DIET" => {
      switch (mentorType) {
        case "YOGAMENTOR":
          return "YOGA";
        case "MEDITATIONMENTOR":
          return "MEDITATION";
        case "DIETPLANNER":
          return "DIET";
        default:
          return "YOGA";
      }
    };

    // Create a new session booking entry using Prisma
    const sessionBookingData = {
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      mentorId: mentorId,
      sessionType: getSessionType(mentor.mentorType),
      scheduledAt: new Date(`${sessionDate}T${sessionTime}`),
      status: "SCHEDULED",
      notes: notes || "",
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: mentor.sessionPrice,
        currency: "INR",
      },
    };

    // Create the session booking using Prisma to ensure proper date handling
    const _sessionBooking = await prisma.sessionBooking.create({
      data: {
        id: sessionBookingData._id,
        userId: sessionBookingData.userId,
        mentorId: sessionBookingData.mentorId,
        sessionType: sessionBookingData.sessionType,
        scheduledAt: sessionBookingData.scheduledAt,
        duration: 60, // Default duration for direct bookings (no timeSlot)
        status: "SCHEDULED",
        notes: sessionBookingData.notes,
        paymentStatus: "COMPLETED",
        amount: mentor.sessionPrice,
        paymentDetails: sessionBookingData.paymentDetails,
      },
    });

    // Get student details for emails and cache invalidation
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Send session booking confirmation emails
    try {
      // Get mentor email
      const mentorDetails = await prisma.user.findUnique({
        where: { id: mentorId },
        select: { name: true, email: true },
      });

      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);

      // Send email to student
      if (student?.email) {
        const studentEmail = sessionBookedTemplate(
          student.name || "there",
          mentor.name || "Your Mentor",
          getSessionType(mentor.mentorType),
          sessionDateTime,
          "60 minutes"
        );
        await sendEmail({
          to: student.email,
          subject: studentEmail.subject,
          text: studentEmail.html,
          html: true,
        });
      }

      // Send email to mentor
      if (mentorDetails?.email) {
        const mentorEmail = sessionBookedMentorTemplate(
          mentor.name || "Mentor",
          student?.name || "Student",
          getSessionType(mentor.mentorType),
          sessionDateTime,
          "60 minutes"
        );
        await sendEmail({
          to: mentorDetails.email,
          subject: mentorEmail.subject,
          text: mentorEmail.html,
          html: true,
        });
      }
    } catch (emailError) {
      console.error("Failed to send session booking emails:", emailError);
      // Don't throw - booking was successful
    }

    // Invalidate billing history cache for the user since they made a payment
    if (student?.email) {
      await invalidateBillingHistoryCache(student.email).catch((err) => {
        console.error("Failed to invalidate billing cache:", err);
        // Don't throw - booking was successful
      });
    }

    return successResponse({
      bookingId: sessionBookingData._id,
      mentorName: mentor.name,
      sessionDate,
      sessionTime,
      amount: mentor.sessionPrice,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
