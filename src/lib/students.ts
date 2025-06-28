"use server"
import { PrismaClient, SubscriptionPlan } from "@prisma/client";

const prisma = new PrismaClient();
export async function getStudents() {
    const students = await prisma.user.findMany({
        where: {
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: {
                in: ["BLOOM", "FLOURISH"]
            },
        },
    })
    return students;
}
