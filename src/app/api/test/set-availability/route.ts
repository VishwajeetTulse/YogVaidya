import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";


export async function POST(request: NextRequest) {
  try {
    const { email, isAvailable } = await request.json();

    const updatedUser = await prisma.user.updateMany({
      where: { email: email },
      data: { isAvailable: isAvailable },
    });

    return NextResponse.json({
      success: true,
      message: `Set ${email} availability to ${isAvailable}`,
      updatedCount: updatedUser.count,
    });
  } catch (error) {
    console.error("❌ Test update failed:", error);
    return NextResponse.json(
      {
        error: "Test update failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
