import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import crypto from "crypto";

// POST /api/tickets/[id]/messages - Add comment/message to ticket
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, isInternal = false } = await request.json();
    const ticketId = (await params).id;

    // Validate content
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Only moderators/admins can create internal messages
    const canCreateInternal = ["MODERATOR", "ADMIN"].includes(session.user.role);
    const messageIsInternal = isInternal && canCreateInternal;

    try {
      // First, verify the ticket exists and user has access
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Check access permissions
      const hasAccess =
        ticket.userId === session.user.id || // Ticket creator
        ticket.assignedToId === session.user.id || // Assigned moderator
        ["ADMIN", "MODERATOR"].includes(session.user.role); // Admin or moderator

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Create the message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newMessage = await (prisma as any).ticketMessage?.create({
        data: {
          id: crypto.randomUUID(),
          content: content.trim(),
          ticketId: ticketId,
          authorId: session.user.id,
          isInternal: messageIsInternal,
          attachments: [], // TODO: Add file upload support later
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Update ticket's updatedAt timestamp
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: newMessage,
      });
    } catch (dbError) {
      console.error("Database error creating message:", dbError);
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in ticket message creation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/tickets/[id]/messages - Get all messages for a ticket
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = (await params).id;

    try {
      // First, verify the ticket exists and user has access
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Check access permissions
      const hasAccess =
        ticket.userId === session.user.id || // Ticket creator
        ticket.assignedToId === session.user.id || // Assigned moderator
        ["ADMIN", "MODERATOR"].includes(session.user.role); // Admin or moderator

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Determine if user can see internal messages
      const canSeeInternal = ["MODERATOR", "ADMIN"].includes(session.user.role);

      // Build filter for messages
      interface MessageFilter {
        ticketId: string;
        isInternal?: boolean;
      }
      const messageFilter: MessageFilter = { ticketId };
      if (!canSeeInternal) {
        messageFilter.isInternal = false;
      }

      // Get all messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = await (prisma as any).ticketMessage?.findMany({
        where: messageFilter,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        messages: messages || [],
      });
    } catch (dbError) {
      console.error("Database error fetching messages:", dbError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in ticket messages fetch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
