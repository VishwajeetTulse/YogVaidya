import { NextRequest, NextResponse } from "next/server";
import { PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

// Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Edit user (name, email, phone, role)
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, email, phone, role } = await req.json();
    const user = await prisma.user.update({
      where: { id },
      data: { name, email, phone, role },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Delete user and their mentor application(s)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    // Find the user to get their email
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    // Delete mentor applications by email (or userId if you prefer)
    await prisma.mentorApplication.deleteMany({ where: { email: user.email } });
    // Delete the user
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}
