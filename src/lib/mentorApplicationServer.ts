import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/email";
import { prisma } from "./prisma";

type MentorType = "YOGAMENTOR" | "MEDITATIONMENTOR";

export async function createMentorApplication({
  name,
  email,
  phone,
  experience,
  expertise,
  certifications,
  powFile,
  mentorType,
}: {
  name: string;
  email: string;
  phone: string;
  experience: string;
  expertise: string;
  certifications: string;
  powFile?: File | null;
  mentorType: MentorType;
}) {
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
  await sendEmail({
    to: email,
    subject: "🧘 YogVaidya Mentor Application Received",
    text: `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="text-align: center; color: #4a4e69;">🙏 Thank You for Applying, ${name}!</h2>
          <p style="font-size: 15px; color: #333;">
            We're excited to let you know that we've received your application to join <strong>YogVaidya</strong> as a <strong>mentor</strong>.
          </p>

          <div style="background-color: #f0f4f8; padding: 16px; border-left: 4px solid #5e60ce; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #222;">
              Our team will carefully review your experience, expertise, and certification details. We'll get back to you soon with the next steps.
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
  return application;
}

export async function getMentorApplications(email?: string) {
  if (email) {
    return prisma.mentorApplication.findMany({ where: { email } });
  }
  return prisma.mentorApplication.findMany();
}

export async function updateMentorApplicationStatus({
  id,
  status,
}: {
  id: string;
  status: "approved" | "rejected";
}) {
  if (!id || !status) throw new Error("Missing id or status");
  const updated = await prisma.mentorApplication.update({
    where: { id },
    data: { status },
  });
  let redirectUrl = null;
  if (status === "approved") {
    await prisma.user.updateMany({
      where: { email: updated.email },
      data: { role: "MENTOR", phone: updated.phone },
    });
    redirectUrl = "/dashboard/mentors";
  }
  return { application: updated, redirectUrl };
}

export async function deleteMentorApplication(email: string) {
  return prisma.mentorApplication.deleteMany({ where: { email } });
} 