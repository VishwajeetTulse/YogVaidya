"use server";

/**
 * SMS Service for sending OTP and notifications
 * 
 * This service supports multiple SMS providers:
 * - Fast2SMS (Default for India) - https://www.fast2sms.com/
 * - MSG91 - https://msg91.com/
 * - Twilio - https://www.twilio.com/
 * 
 * Configure the provider using environment variables:
 * - SMS_PROVIDER: "fast2sms" | "msg91" | "twilio"
 * - SMS_API_KEY: Your API key for the selected provider
 * - SMS_SENDER_ID: Sender ID (for MSG91)
 * - TWILIO_ACCOUNT_SID: Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Twilio Phone Number
 */

interface SMSResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

/**
 * Normalize phone number to include country code
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // If it starts with +, keep it as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it starts with 91 and is 12 digits, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // Default: return as-is with + prefix
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Send SMS using Fast2SMS (Indian SMS Gateway)
 * Sign up at: https://www.fast2sms.com/
 */
async function sendVieFast2SMS(phone: string, message: string): Promise<SMSResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    console.error("FAST2SMS_API_KEY not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    // Extract just the 10-digit number for Fast2SMS
    const phoneNumber = phone.replace(/\D/g, '').slice(-10);
    
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q", // Quick SMS route
        message: message,
        language: "english",
        flash: 0,
        numbers: phoneNumber,
      }),
    });

    const result = await response.json();

    if (result.return === true) {
      return {
        success: true,
        message: "SMS sent successfully",
        messageId: result.request_id,
      };
    } else {
      console.error("Fast2SMS error:", result);
      return {
        success: false,
        error: result.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("Fast2SMS error:", error);
    return {
      success: false,
      error: "Failed to send SMS. Please try again.",
    };
  }
}

/**
 * Send SMS using MSG91
 * Sign up at: https://msg91.com/
 */
async function sendViaMSG91(phone: string, message: string): Promise<SMSResult> {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "YOGVDY";
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!apiKey) {
    console.error("MSG91_API_KEY not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const phoneNumber = normalizePhoneNumber(phone).replace('+', '');
    
    const response = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "authkey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: "0",
        mobiles: phoneNumber,
        VAR1: message, // OTP variable in template
      }),
    });

    const result = await response.json();

    if (result.type === "success") {
      return {
        success: true,
        message: "SMS sent successfully",
        messageId: result.request_id,
      };
    } else {
      console.error("MSG91 error:", result);
      return {
        success: false,
        error: result.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("MSG91 error:", error);
    return {
      success: false,
      error: "Failed to send SMS. Please try again.",
    };
  }
}

/**
 * Send SMS using Twilio
 * Sign up at: https://www.twilio.com/
 */
async function sendViaTwilio(phone: string, message: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const phoneNumber = normalizePhoneNumber(phone);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (result.sid) {
      return {
        success: true,
        message: "SMS sent successfully",
        messageId: result.sid,
      };
    } else {
      console.error("Twilio error:", result);
      return {
        success: false,
        error: result.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("Twilio error:", error);
    return {
      success: false,
      error: "Failed to send SMS. Please try again.",
    };
  }
}

/**
 * Send SMS using the configured provider
 */
export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  const provider = process.env.SMS_PROVIDER || "fast2sms";

  switch (provider.toLowerCase()) {
    case "msg91":
      return sendViaMSG91(phone, message);
    case "twilio":
      return sendViaTwilio(phone, message);
    case "fast2sms":
    default:
      return sendVieFast2SMS(phone, message);
  }
}

/**
 * Send OTP SMS
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
  const message = `Your YogVaidya verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
}

/**
 * Check if SMS service is configured
 */
export async function isSMSConfigured(): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER || "fast2sms";
  
  switch (provider.toLowerCase()) {
    case "msg91":
      return !!process.env.MSG91_API_KEY;
    case "twilio":
      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    case "fast2sms":
    default:
      return !!process.env.FAST2SMS_API_KEY;
  }
}
