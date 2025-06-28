"use server"
import nodemailer from "nodemailer";
import { PrismaClient, Schedule } from "@prisma/client"
const prisma = new PrismaClient();

export async function sendEmail(sessionDetails: Schedule) {
    const emails = await prisma.user.findMany(
        {
            where: {
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: {
                in: [sessionDetails.sessionType == "YOGA" ? "BLOOM" : "SEED" , "FLOURISH" ]
            },
        },
        select: {
            email: true,
        }
        }
    )
    emails.push({email : 'shinderohann02@gmail.com'})
    console.log(emails)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL, 
      pass: process.env.SENDER_EMAIL_PASSWORD,

    },
  });

  try {
    const info = await transporter.sendMail({
      to: emails.map(user => user.email),
      subject: "Scheduled Session : YogVaidya",
      text: `Dear Student,

We're excited to remind you about your upcoming ${sessionDetails.sessionType.toLowerCase()} session with YogVaidya.

Session Details:
- Type: ${sessionDetails.sessionType}
- Date: ${new Date(sessionDetails.scheduledTime).toLocaleDateString()}
- Duration: ${sessionDetails.duration} 

Please ensure you're ready 5-10 minutes before the session begins. If you have any questions or need to reschedule, please contact us as soon as possible.

We look forward to seeing you in class!

Best regards,
The YogVaidya Team`,
    });

    console.log("Email sent (dev mode):", info.messageId);
    console.log("Preview URL: http://localhost:1080"); // MailDev web interface

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email. Is your local MailDev/MailHog running?",
    };
  }
}