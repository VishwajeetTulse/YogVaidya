"use server";   
import { prisma } from "./prisma";
export async function getMentorType(user: { email: string }) {
        const type = await prisma.mentorApplication.findFirst(
            {
                where: { email: user.email },
                select: { mentorType: true }
            }
        )
        return type?.mentorType as "YOGAMENTOR" | "MEDITATIONMENTOR";
}