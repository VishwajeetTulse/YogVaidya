import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

type MentorType = "YOGAMENTOR" | "MEDITATIONMENTOR";

// Create mentor application
export async function POST(req: NextRequest) {
  const data = await req.formData();
  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const phone = data.get("phone") as string;
  const experience = data.get("experience") as string;
  const expertise = data.get("expertise") as string;
  const certifications = data.get("certifications") as string;
  const powFile = data.get("pow") as File | null;
  const mentorType = data.get("mentorType") as string;
  let powUrl: string | null = null;
  if (powFile && powFile.name) {
    const proofsDir = path.join(process.cwd(), "public", "proofs");
    // Ensure the directory exists
    await mkdir(proofsDir, { recursive: true });
    
    // Generate unique filename to avoid conflicts
    const fileExtension = path.extname(powFile.name);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${email.replace(/[@.]/g, '_')}_${timestamp}_${randomString}${fileExtension}`;
    
    await writeFile(
      path.join(proofsDir, uniqueFileName),
      Buffer.from(await powFile.arrayBuffer())
    );
    powUrl = `/proofs/${uniqueFileName}`;
  }

  try {
    const application = await prisma.mentorApplication.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        experience,
        expertise,
        certifications,
        powUrl,
        status: "pending", // Set default status on creation
        mentorType: mentorType as MentorType,
      },
    });

    // Send confirmation email to mentor
    await sendEmail({
      to: email,
      subject: "YogVaidya Mentor Application Received",
      text: `Dear ${name},\n\nThank you for applying to become a YogVaidya mentor! We have received your application and will review it soon.\n\nWarm regards,\nYogVaidya Team`,
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Get mentor applications by email (from query param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  try {
    let applications;
    if (email) {
      applications = await prisma.mentorApplication.findMany({ where: { email } });
    } else {
      applications = await prisma.mentorApplication.findMany();
    }
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Delete mentor application by email (or id)
export async function DELETE(req: NextRequest) {
  const { email } = await req.json();
  try {
    await prisma.mentorApplication.deleteMany({ where: { email } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Update mentor application status by id
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });
    }
    const updated = await prisma.mentorApplication.update({
      where: { id },
      data: { status },
    });
    // If approved, update the user's role to MENTOR and phone number
    let redirectUrl = null;
    if (status === "approved") {
      await prisma.user.updateMany({
        where: { email: updated.email },
        data: { role: "MENTOR", phone: updated.phone },
      });
      redirectUrl = "/dashboard/mentors";
    }
    return NextResponse.json({ success: true, application: updated, redirectUrl });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

