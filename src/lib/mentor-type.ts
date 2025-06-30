"use server";   
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function getMentorType(user: { email: string }) {
        const type = await prisma.mentorApplication.findFirst(
            {
                where: { email: user.email },
                select: { mentorType: true }
            }
        )
        return type?.mentorType as "YOGAMENTOR" | "MEDITATIONMENTOR";
}