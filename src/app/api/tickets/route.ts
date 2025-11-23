import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { TicketLogger, TicketAction } from "@/lib/utils/ticket-logger";
import type { Prisma } from "@prisma/client";

// Import types from our custom types (since Prisma types might not be available yet)
import { TicketStatus, TicketPriority, TicketCategory } from "@/lib/types/tickets";

// Generate a unique ticket number
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  try {
    // Try to find the latest ticket number for this year
    const latestTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let nextNumber = 1;
    if (latestTicket) {
      const currentNumber = parseInt(latestTicket.ticketNumber.replace(prefix, ""));
      nextNumber = currentNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  } catch {
    // If there's an error accessing tickets (e.g., collection doesn't exist yet)

    return `${prefix}001`;
  }
}

// GET /api/tickets - Get tickets (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assigned = searchParams.get("assigned");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = (page - 1) * limit;

    // Build filter conditions based on user role
    const whereConditions: Prisma.TicketWhereInput = {};

    if (session.user.role === "USER") {
      whereConditions.userId = session.user.id;
    } else if (session.user.role === "MODERATOR") {
      if (assigned === "true") {
        whereConditions.assignedToId = session.user.id;
      } else if (assigned === "false") {
        whereConditions.assignedToId = null;
      }
    }
    // Admins see all tickets without additional restrictions

    // Add filters (handle 'all' values from Select components)
    if (status && status !== "all") whereConditions.status = status as TicketStatus;
    if (priority && priority !== "all") whereConditions.priority = priority as TicketPriority;
    if (category && category !== "all") whereConditions.category = category as TicketCategory;

    try {
      // Try to query the database
      const [tickets, totalCount] = await Promise.all([
        prisma.ticket.findMany({
          where: whereConditions,
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
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          skip: offset,
          take: limit,
        }) || [],
        prisma.ticket.count({ where: whereConditions }) || 0,
      ]);

      return NextResponse.json({
        tickets: tickets || [],
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      });
    } catch (dbError) {
      console.error("Database query failed, returning empty result:", dbError);

      // Return empty response if database query fails
      return NextResponse.json({
        tickets: [],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 0,
        },
      });
    }
  } catch (error) {
    console.error("Error in tickets GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, priority, metadata } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    // Validate enums
    if (!Object.values(TicketCategory).includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (priority && !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    try {
      // Generate unique ticket number
      const ticketNumber = await generateTicketNumber();

      // Try to create the ticket in the database
      const ticket = await prisma.ticket.create({
        data: {
          id: crypto.randomUUID(),
          ticketNumber,
          title,
          description,
          category,
          priority: priority || TicketPriority.MEDIUM,
          userId: session.user.id,
          metadata: metadata || {},
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
        },
      });

      // Create initial message
      if (ticket) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).ticketMessage?.create({
          data: {
            id: crypto.randomUUID(),
            content: description,
            ticketId: ticket.id,
            authorId: session.user.id,
            isInternal: false,
          },
        });

        // Log ticket creation
        await TicketLogger.logTicketCreated(
          ticket.id,
          ticket.ticketNumber,
          session.user.id,
          { title, description, category, priority: priority || TicketPriority.MEDIUM },
          request
        );
      }

      return NextResponse.json(
        {
          ticket: ticket || {
            id: crypto.randomUUID(),
            ticketNumber,
            title,
            description,
            status: TicketStatus.OPEN,
            priority: priority || TicketPriority.MEDIUM,
            category,
            userId: session.user.id,
            user: {
              id: session.user.id,
              name: session.user.name || "Unknown",
              email: session.user.email,
              role: session.user.role,
            },
            assignedToId: null,
            assignedTo: null,
            tags: [],
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null,
            closedAt: null,
            messages: [],
            _count: { messages: 1 },
          },
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error creating ticket:", dbError);

      // Log the error
      await TicketLogger.logError(
        session.user.id,
        TicketAction.CREATED,
        `Database error: ${(dbError as Error).message}`,
        undefined,
        undefined,
        request
      );

      return NextResponse.json(
        { error: "Failed to create ticket. Database not ready." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
