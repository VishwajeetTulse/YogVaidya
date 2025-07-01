"use server"
import { prisma } from "./prisma";
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
