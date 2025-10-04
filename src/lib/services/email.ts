"use server";
import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  text,
  html = false, // Default to false, can be set to true if HTML content is provided
}: {
  to: string;
  subject: string;
  text: string;
  html?: boolean;
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      to: to.toLowerCase().trim(),
      subject: subject.trim(),
      text: html ? undefined : text.trim(), // If text is provided, use it as plain text content
      html: html ? text : undefined, // If html is true, use text as HTML content
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
