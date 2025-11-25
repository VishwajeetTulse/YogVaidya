import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { AuthenticationError } from "@/lib/utils/error-handler";
import { sendEmail } from "@/lib/services/email";
import { supportTicketAcknowledgmentTemplate } from "@/lib/services/email-templates";

const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum([
    "SUBSCRIPTION_ISSUE",
    "PAYMENT_PROBLEM",
    "MENTOR_APPLICATION",
    "TECHNICAL_SUPPORT",
    "ACCOUNT_ISSUE",
    "REFUND_REQUEST",
    "GENERAL_INQUIRY",
    "BUG_REPORT",
    "FEATURE_REQUEST",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
});

// Generate a unique ticket number
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  // Get the latest ticket number for this year
  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: { startsWith: prefix },
    },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  let nextNumber = 1;
  if (latestTicket?.ticketNumber) {
    const lastNumber = parseInt(latestTicket.ticketNumber.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Please sign in to create a support ticket");
    }

    const body = await request.json();
    const { title, description, category, priority, tags, metadata } = createTicketSchema.parse(body);

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticketNumber,
        title,
        description,
        category,
        priority,
        tags,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        userId: session.user.id,
        status: "OPEN",
      },
    });

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Send acknowledgment email
    try {
      if (user?.email) {
        const { subject, html } = supportTicketAcknowledgmentTemplate(
          user.name || "there",
          ticketNumber,
          title,
          description
        );
        await sendEmail({
          to: user.email,
          subject,
          text: html,
          html: true,
        });
      }
    } catch (emailError) {
      console.error("Failed to send ticket acknowledgment email:", emailError);
      // Don't throw - ticket was created successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        message: "Support ticket created successfully. We'll get back to you within 24-48 hours.",
      },
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}

// GET - Get user's support tickets
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Please sign in to view your tickets");
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const whereClause: Record<string, unknown> = { userId: session.user.id };
    if (status) {
      whereClause.status = status;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: {
            select: { name: true },
          },
        },
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}
