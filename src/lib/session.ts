"use server"
import { Prisma, PrismaClient } from "@prisma/client";
import { ScheduleStatus } from "@prisma/client";

const prisma = new PrismaClient();
export async function UpdateSessionStatus(status: ScheduleStatus, sessionId: string) {
    await prisma.schedule.update({
        where: { id: sessionId },
        data: { status: status }
    })
    console.log(`Session ${sessionId} status updated to ${status}`);
}