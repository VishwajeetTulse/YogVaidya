import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET (hidden)" : "NOT SET",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    expectedCallback: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    NODE_ENV: process.env.NODE_ENV,
  });
}
