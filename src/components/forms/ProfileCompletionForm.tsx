"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Phone, User, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";

const profileCompletionSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
});

type ProfileCompletionFormValues = z.infer<typeof profileCompletionSchema>;

interface ProfileCompletionFormProps {
  userEmail?: string;
  userName?: string;
  redirectTo?: string;
}

export default function ProfileCompletionForm({
  userEmail,
  userName,
  redirectTo = "/dashboard",
}: ProfileCompletionFormProps) {
  const [_isLoading, _setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [phoneNumberToVerify, setPhoneNumberToVerify] = useState("");
  const [otpMethod, setOtpMethod] = useState<"sms" | "email" | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const form = useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(v => !v);
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  // Send OTP
  const handleSendOTP = async (data: ProfileCompletionFormValues) => {
    setIsSendingOTP(true);

    try {
      const response = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setPhoneNumberToVerify(data.phoneNumber);
        setCountdown(60); // 60 seconds countdown for resend
        setOtpMethod(result.method || "sms");
        
        // Show appropriate message based on delivery method
        if (result.method === "email") {
          toast.success("Verification code sent!", {
            description: `Code sent to your email (${userEmail}) as SMS is unavailable`,
          });
        } else {
          // Mask phone number for display
          const maskedPhone = data.phoneNumber.replace(/\d(?=\d{4})/g, "*");
          toast.success("Verification code sent!", {
            description: `A 6-digit code has been sent to ${maskedPhone}`,
          });
        }
      } else {
        toast.error("Failed to send verification code", {
          description: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsSendingOTP(true);
    try {
      const response = await fetch("/api/users/resend-otp", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        toast.success("Verification code resent!", {
          description: `A new code has been sent to ${userEmail}`,
        });
      } else {
        toast.error("Failed to resend code", {
          description: result.error || "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const response = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otpString,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Phone number verified!", {
          description: "Your profile has been updated successfully.",
        });

        // Redirect to intended destination
        setTimeout(() => {
          router.replace(redirectTo);
        }, 1000);
      } else {
        toast.error("Verification failed", {
          description: result.error || "Invalid code. Please try again.",
        });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Change phone number (go back to input)
  const handleChangePhone = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#76d2fa]/10 to-[#5abe9b]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0">
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] rounded-full flex items-center justify-center mx-auto mb-4">
            {otpSent ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] bg-clip-text text-transparent mb-2">
            {otpSent ? "Verify Your Phone" : "Complete Your Profile"}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600">
            {otpSent 
              ? otpMethod === "email"
                ? `Enter the 6-digit code sent to your email (${userEmail})`
                : `Enter the 6-digit code sent to ${phoneNumberToVerify.replace(/\d(?=\d{4})/g, "*")}`
              : `${userName ? `Hi ${userName}! ` : ""}We need your phone number to complete your YogVaidya account setup.`
            }
          </p>
        </div>

        {!otpSent ? (
          /* Phone Number Input Form */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendOTP)} className="space-y-6">
              {/* Email Display (Read-only) */}
              {userEmail && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-600 text-sm">{userEmail}</span>
                  </div>
                </div>
              )}

              {/* Phone Number Field */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Phone Number *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="+91 98765 43210"
                          disabled={isSendingOTP}
                          className="pl-10 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Why We Need This */}
              <div className="bg-gradient-to-r from-[#76d2fa]/10 to-[#5abe9b]/10 p-4 rounded-lg border border-[#76d2fa]/20">
                <h3 className="font-medium text-gray-800 mb-2">Why do we need your phone number?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Session reminders and updates</li>
                  <li>• Emergency contact for live sessions</li>
                  <li>• Account security and verification</li>
                  <li>• Important subscription notifications</li>
                </ul>
              </div>

              {/* Send OTP Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] hover:from-[#6bc8f0] hover:to-[#4db390] text-white h-12 rounded-lg font-medium transition-all flex items-center justify-center"
                disabled={isSendingOTP}
              >
                {isSendingOTP ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending Code...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send Verification Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>

              {/* Note */}
              <p className="text-xs text-gray-500 text-center">
                A verification code will be sent to your phone number via SMS.
              </p>
            </form>
          </Form>
        ) : (
          /* OTP Verification Form */
          <div className="space-y-6">
            {/* Phone number display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600 text-sm">{phoneNumberToVerify}</span>
                <button
                  type="button"
                  onClick={handleChangePhone}
                  className="text-sm text-[#5a9be9] hover:underline font-medium"
                >
                  Change
                </button>
              </div>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Verification Code</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                    disabled={isVerifyingOTP}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend code in <span className="font-medium text-[#5a9be9]">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isSendingOTP}
                  className="text-sm text-[#5a9be9] hover:underline font-medium flex items-center justify-center mx-auto gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isSendingOTP ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              )}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] hover:from-[#6bc8f0] hover:to-[#4db390] text-white h-12 rounded-lg font-medium transition-all flex items-center justify-center"
              disabled={isVerifyingOTP || otp.some(d => !d)}
            >
              {isVerifyingOTP ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center">
                  Verify & Complete Profile
                  <CheckCircle className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>

            {/* Note */}
            <p className="text-xs text-gray-500 text-center">
              Didn&apos;t receive the code? Check your spam folder or request a new code.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
