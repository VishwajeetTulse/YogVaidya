"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function SigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  // Show success message if redirected from signup
  useEffect(() => {
    const signupSuccess = searchParams.get("signup");
    if (signupSuccess === "success") {
      toast.success("Account created successfully!", {
        description: "Please sign in with your credentials to continue.",
        duration: 5000,
      });
    }
  }, [searchParams]);

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SigninFormValues) => {
    setError("");
    setIsLoading(true);
    const finalRedirect = searchParams.get("from") || "dashboard";
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: `/welcome?from=${finalRedirect}`,
      },
      {
        rememberMe: data.rememberMe, // Pass rememberMe to auth logic
        onSuccess: () => {
          toast.success("Signed in successfully");
        },
        onError: (ctx) => {
          setError(ctx.error.message ?? "Something went wrong.");
          toast.error("Sign in failed", {
            description: ctx.error.message ?? "Something went wrong.",
          });
        },
      }
    );
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGoogleAuth = async () => {
    const finalRedirect = searchParams.get("from") || "dashboard";
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: `/welcome?from=${finalRedirect}`,
      },
      {
        onRequest: () => {
          setPendingGoogle(true);
        },
        onSuccess: async () => {
          toast.success("Signed in with Google");
        },
        onError: (ctx) => {
          toast("Something went wrong", {
            description: ctx.error.message ?? "Something went wrong.",
          });
        },
      }
    );
    setPendingGoogle(false);
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
          href="/"
          className="text-gray-800 hover:text-indigo-600 transition-colors flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </header>

      {/* Sign In Form Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your wellness journey</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full pr-10"
                            disabled={isLoading}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                            onClick={togglePasswordVisibility}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="rememberMe"
                            type="checkbox"
                            className="h-4 w-4 text-[#76d2fa] focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={isLoading}
                            checked={field.value}
                            onChange={field.onChange}
                          />
                          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                            Remember me
                          </label>
                        </div>
                        <div className="text-sm">
                          <Link
                            href="/forgot-password"
                            className="text-[#76d2fa] hover:text-[#5a9be9] font-medium"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                {/* Seperator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-px bg-gray-300 flex-grow mr-2" />
                  <span className="text-gray-900 text-sm">OR</span>
                  <div className="h-px bg-gray-300 flex-grow ml-2" />
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    disabled={pendingGoogle}
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-6"
                  >
                    {pendingGoogle ? (
                      <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 48 48">
                        <g>
                          <path
                            fill="#4285F4"
                            d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.7 30.74 0 24 0 14.82 0 6.71 5.8 2.69 14.09l7.98 6.2C12.13 13.6 17.62 9.5 24 9.5z"
                          />
                          <path
                            fill="#34A853"
                            d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.99 37.13 46.1 31.3 46.1 24.55z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.67 28.29c-1.13-3.36-1.13-6.97 0-10.33l-7.98-6.2C.99 15.1 0 19.41 0 24c0 4.59.99 8.9 2.69 12.24l7.98-6.2z"
                          />
                          <path
                            fill="#EA4335"
                            d="M24 48c6.74 0 12.68-2.22 17.04-6.04l-7.19-5.59c-2.01 1.35-4.59 2.15-7.85 2.15-6.38 0-11.87-4.1-13.33-9.59l-7.98 6.2C6.71 42.2 14.82 48 24 48z"
                          />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </g>
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#76d2fa] hover:bg-[#5a9be9] text-white py-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/signup?from=${searchParams.get("from") || "signin"}`}
                      className="text-[#76d2fa] hover:text-[#5a9be9] font-medium"
                    >
                      Create an account
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
}
