import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";

const updatePhoneSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
});

export async function POST(request: Request) {
  try {
    // Get the session
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePhoneSchema.parse(body);

    // Update user's phone number
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        phone: validatedData.phoneNumber,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating phone number:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid phone number format",
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update phone number" },
      { status: 500 }
    );
  }
}
