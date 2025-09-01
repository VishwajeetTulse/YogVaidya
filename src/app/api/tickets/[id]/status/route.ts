import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { TicketStatus } from "@/lib/types/tickets";

// PATCH /api/tickets/[id]/status - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only moderators and admins can update ticket status
    if (!['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();
    const ticketId = (await params).id;

    // Validate status
    if (!Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    try {
      // Prepare update data
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      // Add timestamp fields based on status
      if (status === TicketStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      } else if (status === TicketStatus.CLOSED) {
        updateData.closedAt = new Date();
        if (!updateData.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
      }

      // Update the ticket status
      const updatedTicket = await (prisma as any).ticket?.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!updatedTicket) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 }
        );
      }

      // Create a system message about the status change
      await (prisma as any).ticketMessage?.create({
        data: {
          id: crypto.randomUUID(),
          content: `Ticket status changed to ${status.replace('_', ' ').toLowerCase()}`,
          ticketId: ticketId,
          authorId: session.user.id,
          isInternal: true
        }
      });

      return NextResponse.json({ 
        success: true,
        ticket: updatedTicket 
      });

    } catch (dbError) {
      console.error("Database error updating ticket status:", dbError);
      return NextResponse.json(
        { error: "Failed to update ticket status" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in ticket status update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
