"use server"
import { User } from "@prisma/client";
import { prisma } from "./config/prisma";
export async function getStudents(mentortype : string) : Promise<User[]> {

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

