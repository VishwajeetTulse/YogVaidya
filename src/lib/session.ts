"use server"

import { ScheduleStatus } from "@prisma/client";
import { prisma } from "./config/prisma";
export async function UpdateSessionStatus(status: ScheduleStatus, sessionId: string) {
    await prisma.schedule.update({
        where: { id: sessionId },
        data: { status: status }
    })
    console.log(`Session ${sessionId} status updated to ${status}`);
}

