import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the email using Better Auth
    const result = await auth.verifyEmail({ token });

    if (result.success) {
      return NextResponse.json(
        { message: "Email verified successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: result.error || "Failed to verify email" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying email" },
      { status: 500 }
    );
  }
} 