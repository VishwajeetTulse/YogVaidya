import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, mentorType: true },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Access denied. Mentor role required." }, { status: 403 });
    }

    const { isAvailable } = await request.json();

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json({ error: "Invalid availability status" }, { status: 400 });
    }

    // Update mentor availability in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { isAvailable },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        mentorType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Availability updated to ${isAvailable ? "Available" : "Unavailable"}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating mentor availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current mentor data with availability
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        role: true,
        mentorType: true,
      },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Access denied. Mentor role required." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching mentor availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
