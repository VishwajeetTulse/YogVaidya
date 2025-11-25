"use server";

import { prisma } from "@/lib/config/prisma";
import { sendOTPSMS, isSMSConfigured } from "./sms";
import { sendEmail } from "./email";

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

// In-memory OTP storage (use Redis in production for better scalability)
// This is a simple solution - in production, consider using a dedicated cache/database
const otpStore = new Map<string, { otp: string; expiresAt: Date; phoneNumber: string }>();

/**
 * Generate a random numeric OTP
 */
function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Clean up expired OTPs from memory
 */
function cleanupExpiredOTPs(): void {
  const now = new Date();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}

/**
 * Send OTP to user's phone number via SMS
 * Falls back to email if SMS service is not configured
 */
export async function sendPhoneOTP({
  userId,
  phoneNumber,
  email,
}: {
  userId: string;
  phoneNumber: string;
  email: string;
}): Promise<{ success: boolean; message?: string; error?: string; method?: "sms" | "email" }> {
  try {
    // Clean up expired OTPs periodically
    cleanupExpiredOTPs();
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in memory with userId as key
    otpStore.set(userId, {
      otp,
      expiresAt,
      phoneNumber,
    });

    // Try to send via SMS first
    if (await isSMSConfigured()) {
      const smsResult = await sendOTPSMS(phoneNumber, otp);
      
      if (smsResult.success) {
        // Mask phone number for display (show last 4 digits)
        const maskedPhone = phoneNumber.replace(/\d(?=\d{4})/g, "*");
        return {
          success: true,
          message: `Verification code sent to ${maskedPhone}`,
          method: "sms",
        };
      }
      
      // If SMS fails, log and fall through to email fallback
      console.error("SMS sending failed, falling back to email:", smsResult.error);
    }

    // Fallback: Send OTP via email if SMS is not configured or failed
    console.log("SMS not configured or failed. Sending OTP via email as fallback.");
    
    const emailResult = await sendEmail({
      to: email,
      subject: "YogVaidya - Phone Verification OTP",
      text: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #76d2fa, #5abe9b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px dashed #76d2fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5a9be9; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    .note { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧘 YogVaidya</h1>
    </div>
    <div class="content">
      <h2>Phone Verification</h2>
      <p>Hello!</p>
      <p>Your verification code for phone number <strong>${phoneNumber}</strong> is:</p>
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
      </div>
      <p>This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <div class="note">
        <strong>Note:</strong> This OTP was sent to your email because SMS delivery is currently unavailable. 
        The OTP is for verifying your phone number ${phoneNumber}.
      </div>
      <p>If you didn't request this verification, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from YogVaidya. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
      `,
      html: true,
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: "Failed to send verification code. Please try again.",
      };
    }

    return {
      success: true,
      message: `Verification code sent to your email (${email}) as SMS is not available`,
      method: "email",
    };
  } catch (error) {
    console.error("Error sending phone OTP:", error);
    return {
      success: false,
      error: "Failed to send verification code. Please try again.",
    };
  }
}

/**
 * Verify OTP and update user's phone number
 */
export async function verifyPhoneOTP({
  userId,
  otp,
}: {
  userId: string;
  otp: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Clean up expired OTPs
    cleanupExpiredOTPs();
    
    // Get stored OTP data
    const otpData = otpStore.get(userId);

    if (!otpData) {
      return {
        success: false,
        error: "No pending verification found. Please request a new code.",
      };
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      // Clear expired OTP
      otpStore.delete(userId);
      return {
        success: false,
        error: "Verification code has expired. Please request a new one.",
      };
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return {
        success: false,
        error: "Invalid verification code. Please try again.",
      };
    }

    // OTP is valid - update phone number in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: otpData.phoneNumber,
        updatedAt: new Date(),
      },
    });

    // Clear OTP data
    otpStore.delete(userId);

    return {
      success: true,
      message: "Phone number verified successfully!",
    };
  } catch (error) {
    console.error("Error verifying phone OTP:", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}

/**
 * Resend OTP to user
 */
export async function resendPhoneOTP({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Get pending phone from OTP store
    const otpData = otpStore.get(userId);
    const pendingPhone = otpData?.phoneNumber;

    if (!pendingPhone) {
      return {
        success: false,
        error: "No pending phone verification found. Please enter your phone number again.",
      };
    }

    // Send new OTP
    return await sendPhoneOTP({
      userId,
      phoneNumber: pendingPhone,
      email,
    });
  } catch (error) {
    console.error("Error resending phone OTP:", error);
    return {
      success: false,
      error: "Failed to resend verification code. Please try again.",
    };
  }
}
