"use server";
import nodemailer from "nodemailer";
import { type Schedule } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function sendEmail(sessionDetails: Schedule) {
  const emails = await prisma.user.findMany({
    where: {
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: {
        in: [sessionDetails.sessionType === "YOGA" ? "BLOOM" : "SEED", "FLOURISH"],
      },
    },
    select: {
      email: true,
    },
  });

  // Add fallback/dev email
  emails.push({ email: "shinderohann02@gmail.com" });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PASSWORD,
    },
  });

  const htmlContent = `
    <div style="background-color: #f9f9f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #4a4e69; text-align: center;">🧘‍♀️ YogVaidya – Session Reminder</h2>
        
        <p style="font-size: 16px;">Dear Student,</p>
        
        <p style="font-size: 16px;">We're excited to remind you about your upcoming <strong style="color: #222;">${sessionDetails.sessionType.toLowerCase()}</strong> session with <strong>YogVaidya</strong>.</p>

        <div style="margin: 20px 0; padding: 20px; background-color: #f0f4f8; border-left: 5px solid #5e60ce; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #222;">📅 Session Details</h3>
          <ul style="list-style-type: none; padding-left: 0; font-size: 15px; line-height: 1.6;">
            <li><strong>Type:</strong> ${sessionDetails.sessionType}</li>
            <li><strong>Date & Time:</strong> ${new Date(sessionDetails.scheduledTime).toLocaleString()}</li>
            <li><strong>Duration:</strong> ${sessionDetails.duration}</li>
          </ul>
        </div>

        <p style="font-size: 15px;">⏰ Please ensure you're ready <strong>5-10 minutes</strong> before the session begins.</p>
        
        <p style="font-size: 15px;">If you have any questions or need to reschedule, feel free to contact us.</p>

        <p style="font-size: 15px;">We look forward to seeing you in class!</p>

        <div style="margin-top: 40px;">
          <p style="font-size: 14px; color: #555;">Warm regards,</p>
          <p style="font-size: 16px; font-weight: bold; color: #4a4e69;">The YogVaidya Team</p>
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;" />

        <footer style="text-align: center; font-size: 12px; color: #999;">
          You are receiving this email because you're subscribed to YogVaidya sessions.<br/>
          YogVaidya Wellness Pvt. Ltd., India
        </footer>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      bcc: emails.map((user) => user.email),
      subject: "🗓️ Scheduled Session – YogVaidya",
      html: htmlContent,
    });

    console.log("Email sent (dev mode):", info.messageId);
    console.log("Preview URL: http://localhost:1080");

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
