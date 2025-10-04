import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { TicketLogger, TicketAction } from "@/lib/utils/ticket-logger";

// PATCH /api/tickets/[id]/assign - Assign ticket to moderator
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can assign tickets (to maintain hierarchy)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can assign tickets" },
        { status: 403 }
      );
    }

    const { assigneeId } = await request.json();
    const ticketId = (await params).id;

    try {
      // Get ticket details and assignee information for logging
      const currentTicket = await (prisma as any).ticket?.findUnique({
        where: { id: ticketId },
        select: { ticketNumber: true },
      });

      let assigneeName = null;
      if (assigneeId) {
        const assignee = await (prisma as any).user?.findUnique({
          where: { id: assigneeId },
          select: { name: true, email: true },
        });
        assigneeName = assignee?.name || assignee?.email || "Unknown User";
      }

      // Update the ticket assignment
      const updatedTicket = await (prisma as any).ticket?.update({
        where: { id: ticketId },
        data: {
          assignedToId: assigneeId || null,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!updatedTicket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Log the assignment action
      await TicketLogger.logAssignment(
        ticketId,
        currentTicket?.ticketNumber || "Unknown",
        session.user.id,
        assigneeId || null,
        assigneeName,
        request
      );

      // Create a system message about the assignment
      await (prisma as any).ticketMessage?.create({
        data: {
          id: crypto.randomUUID(),
          content: assigneeId ? `Ticket assigned to moderator` : `Ticket unassigned`,
          ticketId: ticketId,
          authorId: session.user.id,
          isInternal: true,
        },
      });

      return NextResponse.json({
        success: true,
        ticket: updatedTicket,
      });
    } catch (dbError) {
      console.error("Database error assigning ticket:", dbError);

      // Log the error
      await TicketLogger.logError(
        session.user.id,
        TicketAction.ASSIGNED,
        `Database error: ${(dbError as Error).message}`,
        ticketId,
        undefined,
        request
      );

      return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in ticket assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
