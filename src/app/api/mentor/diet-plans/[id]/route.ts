import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Unauthorized - Mentors only" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the diet plan exists and belongs to this mentor
    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id },
      select: { mentorId: true },
    });

    if (!dietPlan) {
      return NextResponse.json(
        { error: "Diet plan not found" },
        { status: 404 }
      );
    }

    if (dietPlan.mentorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own diet plans" },
        { status: 403 }
      );
    }

    // Delete the diet plan
    await prisma.dietPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Diet plan deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
