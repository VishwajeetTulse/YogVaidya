export async function GET(request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const resolvedParams = await params;

    return NextResponse.json({
      success: true,
      message: "Test route working",
      slotId: resolvedParams.slotId,
      path: "/api/mentor/timeslots/[slotId]/test",
    });
  } catch (error) {
    console.error("Test route error:", error);
    return NextResponse.json({ success: false, error: "Test route failed" }, { status: 500 });
  }
}
