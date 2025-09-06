import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";

const pricingSchema = z.object({
  sessionPrice: z.number().min(0).max(10000, "Session price must be between 0 and 10,000"),
});

// GET - Get mentor's current pricing
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is a mentor
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        sessionPrice: true,
      },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can access pricing" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionPrice: user.sessionPrice,
      },
    });
  } catch (error) {
    console.error("Error fetching mentor pricing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

// PUT - Update mentor's pricing
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated and is a mentor
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can update pricing" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const pricingData = pricingSchema.parse(body);

    // Update mentor pricing
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionPrice: pricingData.sessionPrice,
      },
      select: {
        sessionPrice: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionPrice: updatedUser.sessionPrice,
      },
      message: "Pricing updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid pricing data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating mentor pricing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
