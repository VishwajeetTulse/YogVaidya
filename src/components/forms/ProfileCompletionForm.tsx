"use client";

import React, { useState } from "react";
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
import { Phone, User, ArrowRight } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: ProfileCompletionFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/update-phone", {
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
        toast.success("Profile updated successfully!", {
          description: "Your phone number has been added to your account.",
        });

        // Redirect to intended destination
        setTimeout(() => {
          router.replace(redirectTo);
        }, 1000);
      } else {
        toast.error("Failed to update profile", {
          description: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#76d2fa]/10 to-[#5abe9b]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0">
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600">
            {userName ? `Hi ${userName}! ` : ""}We need your phone number to complete your YogVaidya
            account setup.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] hover:from-[#6bc8f0] hover:to-[#4db390] text-white h-12 rounded-lg font-medium transition-all flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating Profile...
                </div>
              ) : (
                <div className="flex items-center">
                  Complete Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>

            {/* Note */}
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to provide accurate contact information for your YogVaidya
              account.
            </p>
          </form>
        </Form>
      </Card>
    </div>
  );
}
