"use server";

import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { getMentorStudents } from "@/lib/server/mentor-overview-server";

export interface MentorStudentData {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: "BLOOM" | "FLOURISH";
  subscriptionStartDate: Date | null;
  createdAt: Date;
}

export interface MentorStudentsResponse {
  success: boolean;
  data?: {
    totalActiveStudents: number;
    mentorSessions: number;
    students: MentorStudentData[];
  };
  error?: string;
}

export async function getMentorStudentsData(): Promise<MentorStudentsResponse> {
  try {
    // Get the session using headers
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify the user is a mentor (this check is also done in getMentorStudents)
    const mentorStudentsData = await getMentorStudents(session.user.id);

    return {
      success: true,
      data: {
        totalActiveStudents: mentorStudentsData.totalActiveStudents,
        mentorSessions: mentorStudentsData.mentorSessions,
        students: mentorStudentsData.students as MentorStudentData[],
      },
    };
  } catch (error) {
    console.error("Error fetching mentor students data:", error);
    return { success: false, error: "Failed to fetch students data" };
  }
}
