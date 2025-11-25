import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { resendPhoneOTP } from "@/lib/services/otp";

export async function POST() {
  try {
    // Get the session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Resend OTP
    const result = await resendPhoneOTP({
      userId: session.user.id,
      email: session.user.email,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error resending OTP:", error);

    return NextResponse.json(
      { success: false, error: "Failed to resend verification code" },
      { status: 500 }
    );
  }
}
