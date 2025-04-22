"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, EyeOff, ArrowRight, Check, Upload } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function MentorApplyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    certification: "",
    experience: "",
    proofOfWork: null as File | null,
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pre-fill the form with session user data if available
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email
      }));
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        proofOfWork: e.target.files[0],
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name || !formData.phoneNumber || !formData.email) {
        setError("Please fill in all required fields in this step");
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }
      
      // Phone validation - basic validation for now
      if (formData.phoneNumber.length < 10) {
        setError("Please enter a valid phone number");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.certification || !formData.experience || !formData.proofOfWork) {
        setError("Please fill in all required fields and upload your proof of work");
        return;
      }
    }
    
    setError(""); // Clear any errors
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError(""); // Clear any errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Validate final step
      if (!formData.password || !formData.confirmPassword) {
        throw new Error("Please fill in all required fields");
      }
      
      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("email", formData.email);
      submitData.append("certification", formData.certification);
      submitData.append("experience", formData.experience);
      if (formData.proofOfWork) {
        submitData.append("proofOfWork", formData.proofOfWork);
      }
      
      // Submit application
      const response = await fetch("/api/mentors/apply", {
        method: "POST",
        body: submitData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit application");
      }
      
      // Redirect to success page
      router.push("/mentors/apply/success");
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

        <Link href="/mentors" className="text-gray-800 hover:text-indigo-600 transition-colors flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mentors
        </Link>
      </header>

      {/* Application Form Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a YogaVaidya Mentor</h1>
            <p className="text-gray-600">
              Share your expertise and help others on their wellness journey
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-full flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#76d2fa] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : 1}
              </div>
              <div className={`flex-grow h-1 mx-2 ${currentStep >= 2 ? 'bg-[#76d2fa]' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#76d2fa] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5" /> : 2}
              </div>
              <div className={`flex-grow h-1 mx-2 ${currentStep >= 3 ? 'bg-[#76d2fa]' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-[#76d2fa] text-white' : 'bg-gray-200 text-gray-500'}`}>
                3
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                  
                  {/* Name Input */}
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label 
                      htmlFor="phoneNumber" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>

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
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      className="w-full"
                      disabled={isLoading || !!session?.user?.email}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center"
                      disabled={isLoading}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Professional Information */}
              {currentStep === 2 && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
                  
                  {/* Certification */}
                  <div>
                    <label 
                      htmlFor="certification" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Certification
                    </label>
                    <Input
                      id="certification"
                      name="certification"
                      type="text"
                      value={formData.certification}
                      onChange={handleInputChange}
                      placeholder="Your yoga certifications"
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label 
                      htmlFor="experience" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Experience
                    </label>
                    <Textarea
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Describe your experience in yoga or wellness"
                      required
                      className="w-full min-h-[120px]"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Proof of Work */}
                  <div>
                    <label 
                      htmlFor="proofOfWork" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Proof of Work
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="proofOfWork"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-[#76d2fa] hover:text-[#5a9be9] focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="proofOfWork"
                              name="proofOfWork"
                              type="file"
                              onChange={handleFileChange}
                              className="sr-only"
                              disabled={isLoading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, PNG, JPG up to 10MB
                        </p>
                        {formData.proofOfWork && (
                          <p className="text-sm text-green-600">
                            File selected: {formData.proofOfWork.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      onClick={prevStep}
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center"
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center"
                      disabled={isLoading}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Account Setup */}
              {currentStep === 3 && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Account Setup</h2>
                  
                  {/* Only show password fields if user is not signed in */}
                  {!session?.user ? (
                    <>
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
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a password"
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
                        <p className="text-sm text-gray-500 mt-1">
                          Must be at least 8 characters long
                        </p>
                      </div>

                      {/* Confirm Password Input */}
                      <div>
                        <label 
                          htmlFor="confirmPassword" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Confirm Password
                        </label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm your password"
                          required
                          className="w-full"
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                      <p className="text-blue-800">
                        You're applying as: <strong>{session.user.email}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      onClick={prevStep}
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center"
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </>
              )}
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