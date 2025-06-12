import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function createMentorApplication({
  name,
  email,
  phone,
  experience,
  expertise,
  certifications,
  powFile,
}: {
  name: string;
  email: string;
  phone: string;
  experience: string;
  expertise: string;
  certifications: string;
  powFile?: File | null;
}) {
  let powUrl: string | null = null;
  if (powFile && powFile.name) {
    const proofsDir = path.join(process.cwd(), "public", "proofs");
    await mkdir(proofsDir, { recursive: true });
    await writeFile(
      path.join(proofsDir, powFile.name),
      Buffer.from(await powFile.arrayBuffer())
    );
    powUrl = `/proofs/${powFile.name}`;
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
      status: "pending",
    },
  });
  await sendEmail({
    to: email,
    subject: "YogVaidya Mentor Application Received",
    text: `Dear ${name},\n\nThank you for applying to become a YogVaidya mentor! We have received your application and will review it soon.\n\nWarm regards,\nYogVaidya Team`,
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