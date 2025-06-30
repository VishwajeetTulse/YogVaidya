"use server"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function getStudents(mentortype : string) {

    const students = await prisma.user.findMany({
        where: {
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: {
                in: [mentortype == "YOGAMENTOR" ? "BLOOM" : "SEED" , "FLOURISH" ]
            },
        },
    })
    return students;
}
