export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Static test route working",
    path: "/api/mentor/timeslots/simple-test",
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Static POST test route working",
    path: "/api/mentor/timeslots/simple-test",
  });
}
