import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/services/email";
import { prisma } from "@/lib/config/prisma";
import { MentorType } from "@prisma/client";

// Create mentor application
export async function POST(req: NextRequest) {
  const data = await req.formData();
  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const phone = data.get("phone") as string;
  const experienceStr = data.get("experience") as string;
  const experience = parseInt(experienceStr, 10); // Convert to number
  const expertise = data.get("expertise") as string;
  const certifications = data.get("certifications") as string;
  const powFile = data.get("pow") as File | null;
  const mentorType = data.get("mentorType") as MentorType;
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
        mentorType: mentorType,
      },
    });

    // Send confirmation email to mentor
await sendEmail({
  to: email,
  subject: "🧘 YogVaidya Mentor Application Received",
  text: `
    <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #4a4e69;">🙏 Thank You for Applying, ${name}!</h2>
        <p style="font-size: 15px; color: #333;">
          We’re excited to let you know that we’ve received your application to join <strong>YogVaidya</strong> as a <strong>mentor</strong>.
        </p>

        <div style="background-color: #f0f4f8; padding: 16px; border-left: 4px solid #5e60ce; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #222;">
            Our team will carefully review your experience, expertise, and certification details. We’ll get back to you soon with the next steps.
          </p>
        </div>

        <p style="font-size: 15px;">If you have any questions or need to update your application, feel free to reply to this email.</p>

        <p style="font-size: 15px;">Warm regards,<br/><strong>The YogVaidya Team</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

        <footer style="text-align: center; font-size: 12px; color: #888;">
          YogVaidya Wellness Pvt. Ltd.<br/>
          This is an automated email—please do not reply directly.
        </footer>
      </div>
    </div>
  `,
  html: true
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


