"use server"
import { User } from "@prisma/client";
import { prisma } from "./config/prisma";

/**
 * Get students for a specific mentor type
 * Filters users who have role "USER" (excluding mentors who have role "MENTOR")
 */
export async function getStudents(mentortype : string) : Promise<User[]> {

    const students = await prisma.user.findMany({
        where: {
            role: "USER", // Only users with USER role (mentors have MENTOR role)
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: {
                in: [mentortype == "YOGAMENTOR" ? "BLOOM" : "SEED" , "FLOURISH" ]
            },
        },
    })
    return students;
}

