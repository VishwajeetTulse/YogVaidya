import schedule from "node-schedule";
import { sendEmail } from "../lib/email-student-for-session";
import { Schedule } from "@prisma/client";

/* Schedules an email to be sent 1 hour before the session.
 */
export function scheduleEmailReminder(session: Schedule) {
  const sessionTime = new Date(session.scheduledTime);
  const reminderTime = new Date(sessionTime.getTime() - 60 * 60 * 1000); // 1 hour before

  if (reminderTime < new Date()) {
    console.warn(`🟡 Skipped scheduling for past time: ${reminderTime.toString()}`);
    return;
  }

  console.log(`📆 Scheduling email for session '${session.id}' at ${reminderTime.toString()}`);

  schedule.scheduleJob(reminderTime, async () => {
    console.log(`📩 Sending email for session '${session.id}'`);
    await sendEmail(session);
  });
}
