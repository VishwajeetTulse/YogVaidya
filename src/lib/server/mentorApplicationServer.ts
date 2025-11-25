import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/services/email";
import { newMentorApplicationTemplate } from "@/lib/services/email-templates";
import { prisma } from "@/lib/config/prisma";
import { type MentorType } from "@prisma/client";
import { logInfo, logWarning } from "@/lib/utils/logger";

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
  experience: number; // Changed back to number to match Prisma schema (Int)
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
    const uniqueFileName = `${email.replace(/[@.]/g, "_")}_${timestamp}_${randomString}${fileExtension}`;

    await writeFile(path.join(proofsDir, uniqueFileName), Buffer.from(await powFile.arrayBuffer()));
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

  // Log mentor application submission
  await logInfo(
    "MENTOR_APPLICATION_SUBMITTED",
    "MENTOR",
    `New ${mentorType} mentor application from ${email}`,
    undefined,
    {
      email,
      name,
      mentorType,
      experience,
      expertise: expertise.substring(0, 100), // Truncate for logging
      hasProofOfWork: !!powUrl,
      applicationId: application.id,
    }
  );
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
    html: true,
  });

  // Send notification to all admins and moderators about the new application
  try {
    const adminModerators = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MODERATOR"] },
      },
      select: { email: true, name: true },
    });

    if (adminModerators.length > 0) {
      const { subject, html } = newMentorApplicationTemplate(
        name,
        email,
        mentorType,
        `${experience} years`,
        expertise
      );

      // Send to all admins/moderators
      for (const admin of adminModerators) {
        await sendEmail({
          to: admin.email,
          subject,
          text: html,
          html: true,
        });
      }
    }
  } catch (adminEmailError) {
    console.error("Failed to send mentor application notification to admins:", adminEmailError);
    // Don't throw - application was created successfully
  }

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
  currentUserRole = "ADMIN", // Default to ADMIN for backward compatibility
}: {
  id: string;
  status: "approved" | "rejected";
  currentUserRole?: string;
}) {
  if (!id || !status) throw new Error("Missing id or status");

  const updated = await prisma.mentorApplication.update({
    where: { id },
    data: { status },
  });

  let redirectUrl = null;

  if (status === "approved") {
    // Update user to be a mentor with the appropriate mentor type
    await prisma.user.updateMany({
      where: { email: updated.email },
      data: {
        role: "MENTOR",
        phone: updated.phone,
        mentorType: updated.mentorType, // Add the mentor type from the application
      },
    });

    // Log mentor approval
    await logInfo(
      "MENTOR_APPLICATION_APPROVED",
      currentUserRole as "ADMIN" | "MODERATOR",
      `Approved ${updated.mentorType} mentor: ${updated.email}`,
      undefined, // adminId would be better if available
      {
        applicationId: id,
        mentorEmail: updated.email,
        mentorName: updated.name,
        mentorType: updated.mentorType,
        experience: updated.experience,
        approvalDate: new Date().toISOString(),
      }
    );

    // Send approval email to the new mentor
    try {
      await sendEmail({
        to: updated.email,
        subject: "🎉 Welcome to YogVaidya - Mentor Application Approved!",
        text: `
          <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="text-align: center; color: #4a4e69;">🎉 Congratulations, ${updated.name}!</h2>
              <p style="font-size: 15px; color: #333;">
                We're thrilled to welcome you to the <strong>YogVaidya</strong> mentor community as a <strong>${updated.mentorType === "YOGAMENTOR" ? "Yoga" : "Meditation"} Mentor</strong>!
              </p>

              <div style="background-color: #e8f5e8; padding: 16px; border-left: 4px solid #4caf50; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #222;">
                  Your application has been approved. You now have access to the mentor dashboard where you can schedule sessions, manage students, and share your expertise.
                </p>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="background-color: #5e60ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Access Your Mentor Dashboard
                </a>
              </div>

              <p style="font-size: 15px;">We're excited to see the positive impact you'll make on our community!</p>

              <p style="font-size: 15px;">Best regards,<br/><strong>The YogVaidya Team</strong></p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

              <footer style="text-align: center; font-size: 12px; color: #888;">
                YogVaidya Wellness Pvt. Ltd.<br/>
                This is an automated email—please do not reply directly.
              </footer>
            </div>
          </div>
        `,
        html: true,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't throw error here as the main operation (approval) was successful
    }

    redirectUrl = "/dashboard/mentors";
  } else if (status === "rejected") {
    // Log mentor rejection
    await logWarning(
      "MENTOR_APPLICATION_REJECTED",
      currentUserRole as "ADMIN" | "MODERATOR",
      `Rejected ${updated.mentorType} mentor application: ${updated.email}`,
      undefined, // adminId would be better if available
      {
        applicationId: id,
        mentorEmail: updated.email,
        mentorName: updated.name,
        mentorType: updated.mentorType,
        experience: updated.experience,
        rejectionDate: new Date().toISOString(),
        reason: `${currentUserRole.toLowerCase()}_decision`,
      }
    );

    // Send rejection email
    try {
      await sendEmail({
        to: updated.email,
        subject: "YogVaidya Mentor Application Update",
        text: `
          <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="text-align: center; color: #4a4e69;">Thank You for Your Interest, ${updated.name}</h2>
              <p style="font-size: 15px; color: #333;">
                Thank you for your interest in becoming a mentor with <strong>YogVaidya</strong>.
              </p>

              <div style="background-color: #fff3e0; padding: 16px; border-left: 4px solid #ff9800; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #222;">
                  After careful review, we've decided not to move forward with your application at this time. This decision doesn't reflect your qualifications, but rather our current specific needs.
                </p>
              </div>

              <p style="font-size: 15px;">We encourage you to apply again in the future as our needs evolve.</p>

              <p style="font-size: 15px;">Best regards,<br/><strong>The YogVaidya Team</strong></p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

              <footer style="text-align: center; font-size: 12px; color: #888;">
                YogVaidya Wellness Pvt. Ltd.<br/>
                This is an automated email—please do not reply directly.
              </footer>
            </div>
          </div>
        `,
        html: true,
      });
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }
  }

  return { application: updated, redirectUrl };
}

export async function deleteMentorApplication(email: string) {
  return prisma.mentorApplication.deleteMany({ where: { email } });
}
