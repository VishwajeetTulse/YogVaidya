"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { auth } from "@/server/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    async function verifyToken() {
      if (token) {
        setIsVerifying(true);
        try {
          const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setVerificationStatus("success");
            setMessage("Your email has been successfully verified!");
            // Redirect to the homepage after 3 seconds
            setTimeout(() => {
              router.push("/");
            }, 3000);
          } else {
            setVerificationStatus("error");
            setMessage(data.message || "Email verification failed. The token may have expired.");
          }
        } catch (error) {
          setVerificationStatus("error");
          setMessage("An unexpected error occurred during verification.");
        } finally {
          setIsVerifying(false);
        }
      }
    }
    
    verifyToken();
  }, [token, router]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
        {token ? (
          <>
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Verifying your email...</h1>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`w-20 h-20 ${verificationStatus === "success" ? "bg-green-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <Mail className={`w-10 h-10 ${verificationStatus === "success" ? "text-green-600" : "text-red-600"}`} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">{verificationStatus === "success" ? "Email Verified!" : "Verification Failed"}</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                {verificationStatus === "success" ? (
                  <p className="text-gray-500">Redirecting you to the homepage...</p>
                ) : (
                  <Link href="/signin">
                    <Button className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center mx-auto">
                      Go to Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Verify Your Email</h1>
            
            <p className="text-gray-600 mb-6">
              We've sent a verification link to your email address. Please check your inbox and click the verification link to complete the signup process.
            </p>
            
            <p className="text-gray-500 mb-8">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
            
            <Link href="/signup">
              <Button className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center mx-auto">
                Return to Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </div>
      
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
} 