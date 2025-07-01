"use server"
import { Prisma } from "@prisma/client";
import { ScheduleStatus } from "@prisma/client";
import { prisma } from "./prisma";
export async function UpdateSessionStatus(status: ScheduleStatus, sessionId: string) {
    await prisma.schedule.update({
        where: { id: sessionId },
        data: { status: status }
    })
    console.log(`Session ${sessionId} status updated to ${status}`);
}