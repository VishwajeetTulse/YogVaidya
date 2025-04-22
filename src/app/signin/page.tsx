"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function SigninPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState({
      ...formState,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Form validation
      if (!formState.email || !formState.password) {
        throw new Error("Please fill in all required fields");
      }

      // Sign in with Better Auth
      const result = await signIn.email({
        email: formState.email,
        password: formState.password,
      });
      
      if (!result.success) {
        throw new Error(result.error || "Authentication failed");
      }
      
      // Redirect to homepage after successful login
      router.push('/');
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn.social({
        provider: "google",
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <span className="text-2xl font-semibold text-gray-800">
              YogaVaidya
            </span>
          </Link>
        </div>

        <Link href="/" className="text-gray-800 hover:text-indigo-600 transition-colors flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </header>

      {/* Sign In Form Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Sign in to continue your wellness journey
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formState.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    className="w-full pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formState.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#76d2fa] focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link href="#" className="text-[#76d2fa] hover:text-[#5a9be9] font-medium">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-[#76d2fa] hover:bg-[#5a9be9] text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              {/* Social Sign-in Options */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button" 
                onClick={handleGoogleSignIn}
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-6 flex items-center justify-center"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M12 5c1.6173 0 3.0854.4762 4.3076 1.2422l3.193-3.193C17.3084 1.1422 14.7304 0 12 0 7.3924 0 3.3976 2.6966 1.3858 6.5856l3.7236 2.907C6.4182 6.4066 9.0248 5 12 5z"
                  />
                  <path
                    fill="#34A853"
                    d="M23.49 12.275c0-.8006-.0736-1.5684-.2088-2.3094H12v4.5158h6.4756c-.2784 1.5026-1.1232 2.7744-2.3958 3.6252l3.6764 2.858c2.1506-1.9878 3.3918-4.915 3.3918-8.6896z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.1094 14.1394c-.315-.9466-.4956-1.9566-.4956-3 0-1.0434.1806-2.0534.4956-3L1.3858 5.2324C.5022 7.3344 0 9.6156 0 12c0 2.3844.5022 4.6656 1.3858 6.7676l3.7236-2.9076z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 24c3.3408 0 6.1458-1.116 8.196-3.0294l-3.6764-2.858c-1.0182.6836-2.3196 1.0874-4.5196 1.0874-3.4596 0-6.3864-2.3328-7.4292-5.4692L1.3592 16.7676C3.3592 20.9756 7.3782 24 12 24z"
                  />
                </svg>
                Sign in with Google
              </Button>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-[#76d2fa] hover:text-[#5a9be9] font-medium">
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
} 