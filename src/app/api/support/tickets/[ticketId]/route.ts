import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";

import { AuthenticationError, NotFoundError, AuthorizationError } from "@/lib/utils/error-handler";
import { sendEmail } from "@/lib/services/email";
import { supportTicketUpdateTemplate } from "@/lib/services/email-templates";

const updateTicketSchema = z.object({
  status: z.enum(["IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"]).optional(),
  message: z.string().min(1, "Message is required when updating status"),
  assignedToId: z.string().optional(),
});

// GET - Get a specific ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Please sign in to view ticket details");
    }

    const { ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    // Check authorization - user can view their own tickets, admin/moderator can view all
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isOwner = ticket.userId === session.user.id;
    const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

    if (!isOwner && !isStaff) {
      throw new AuthorizationError("You are not authorized to view this ticket");
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status (for moderators/admins)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Please sign in");
    }

    // Check if user is admin or moderator
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "MODERATOR") {
      throw new AuthorizationError("Only administrators and moderators can update tickets");
    }

    const { ticketId } = await params;
    const body = await request.json();
    const { status, message, assignedToId } = updateTicketSchema.parse(body);

    // Get the current ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
      if (status === "CLOSED") {
        updateData.closedAt = new Date();
      }
    }

    if (assignedToId) {
      updateData.assignedToId = assignedToId;
    } else if (assignedToId === undefined && !ticket.assignedToId) {
      // Auto-assign to the moderator who is updating if not assigned
      updateData.assignedToId = session.user.id;
    }

    // Update the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignedTo: {
          select: { name: true },
        },
      },
    });

    // Send status update email to user
    try {
      if (ticket.user?.email && status) {
        // Map status to email template status
        const emailStatus = status === "IN_PROGRESS" 
          ? "in-progress" 
          : status === "RESOLVED" 
            ? "resolved" 
            : status === "CLOSED" 
              ? "closed" 
              : "in-progress";

        const { subject, html } = supportTicketUpdateTemplate(
          ticket.user.name || "there",
          ticket.ticketNumber,
          ticket.title,
          emailStatus as "in-progress" | "resolved" | "closed",
          message,
          updatedTicket.assignedTo?.name ?? currentUser?.name ?? undefined
        );

        await sendEmail({
          to: ticket.user.email,
          subject,
          text: html,
          html: true,
        });
      }
    } catch (emailError) {
      console.error("Failed to send ticket update email:", emailError);
      // Don't throw - ticket was updated successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket: updatedTicket,
        message: "Ticket updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating ticket:", error);

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
      { success: false, error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
