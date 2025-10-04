"use server";

import {
  createMentorApplication,
  getMentorApplications,
  deleteMentorApplication,
  updateMentorApplicationStatus,
} from "../server/mentorApplicationServer";
import { type MentorType } from "@prisma/client";

export async function createMentorApplicationAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const experienceStr = formData.get("experience") as string;
    const experience = parseInt(experienceStr, 10); // Convert string to number
    const expertise = formData.get("expertise") as string;
    const certifications = formData.get("certifications") as string;
    const mentorType = formData.get("mentorType") as MentorType;
    const powFile = formData.get("pow") as File | null;

    const application = await createMentorApplication({
      name,
      email,
      phone,
      experience,
      expertise,
      certifications,
      powFile,
      mentorType,
    });

    return { success: true, application };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Submission failed",
    };
  }
}

export async function getMentorApplicationsAction(email?: string) {
  try {
    const applications = await getMentorApplications(email);
    return { success: true, applications };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch applications",
    };
  }
}

export async function deleteMentorApplicationAction(email: string) {
  try {
    await deleteMentorApplication(email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function updateMentorApplicationStatusAction(
  id: string,
  status: "approved" | "rejected",
  currentUserRole: string = "ADMIN"
) {
  try {
    const result = await updateMentorApplicationStatus({ id, status, currentUserRole });
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status update failed",
    };
  }
}
