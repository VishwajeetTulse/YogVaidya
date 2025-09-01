import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { TicketStatus } from "@/lib/types/tickets";

// PATCH /api/tickets/[id]/assign - Assign ticket to moderator
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only moderators and admins can assign tickets
    if (!['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assigneeId } = await request.json();
    const ticketId = (await params).id;

    try {
      // Update the ticket assignment
      const updatedTicket = await (prisma as any).ticket?.update({
        where: { id: ticketId },
        data: { 
          assignedToId: assigneeId || null,
          updatedAt: new Date()
        },
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

      // Create a system message about the assignment
      await (prisma as any).ticketMessage?.create({
        data: {
          id: crypto.randomUUID(),
          content: assigneeId 
            ? `Ticket assigned to moderator`
            : `Ticket unassigned`,
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
      console.error("Database error assigning ticket:", dbError);
      return NextResponse.json(
        { error: "Failed to assign ticket" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in ticket assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
