"use client";
import React, { useState } from "react";
import { Mail, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import { InputField } from "@/components/Auth/FormFields";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/lib/schema/forgotPasswordSchema";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  const [pending, setPending] = useState(false);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setPending(true);
    const { error } = await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      toast.error("Error Sending Email", {
        description: error.message,
      });
    } else {
      toast.message("Email Sent", {
        description: "If an account exists with this email, you will receive a password reset link",
      });
    }
    setPending(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-gray-800">YogVaidya</span>
          </Link>
        </div>
        <Link
          href="/signin"
          className="text-gray-800 hover:text-indigo-600 transition-colors flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Link>
      </header>
      {/* Forgot Password Form Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
            <p className="text-gray-600">Enter your email to receive a password reset link</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="john.doe@example.com"
                  type="email"
                  icon={<Mail className="h-5 w-5 text-muted-foreground" />}
                />
                <Button
                  type="submit"
                  className="w-full bg-[#76d2fa] hover:bg-[#5a9be9] text-white py-6"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending email...
                    </>
                  ) : (
                    <>
                      Send Reset Link <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <Link
                      href="/signin"
                      className="text-[#76d2fa] hover:text-[#5a9be9] font-medium"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default ForgotPassword;
