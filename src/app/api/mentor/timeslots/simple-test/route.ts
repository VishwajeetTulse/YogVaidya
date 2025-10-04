import { NextResponse } from "next/server";

export async function GET() {
  console.log("🧪 Simple static test route accessed");
  return NextResponse.json({
    success: true,
    message: "Static test route working",
    path: "/api/mentor/timeslots/simple-test",
  });
}

export async function POST() {
  console.log("🧪 Simple static POST test route accessed");
  return NextResponse.json({
    success: true,
    message: "Static POST test route working",
    path: "/api/mentor/timeslots/simple-test",
  });
}
