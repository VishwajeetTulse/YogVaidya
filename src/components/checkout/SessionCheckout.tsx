"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Calendar, Clock, User, IndianRupeeIcon, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Script from "next/script";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface MentorData {
  id: string;
  name: string;
  email: string;
  image?: string;
  sessionPrice: number;
  mentorType: string;
  experience?: number;
  certifications?: string;
  expertise?: string;
}

export default function SessionCheckout({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [canBookSession, setCanBookSession] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<{
    hasActiveSessions: boolean;
    activeSessionsCount: number;
    completedSessionsCount: number;
  } | null>(null);

  // Form state
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState(""); // This will store 24hr format internally
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [notes, setNotes] = useState("");

  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return { value: hour.toString(), label: hour.toString().padStart(2, "0") };
  });

  const minutes = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return { value: minute.toString(), label: minute.toString().padStart(2, "0") };
  });

  const periods = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  // Update sessionTime when hour/minute/period changes
  useEffect(() => {
    if (selectedHour && selectedMinute && selectedPeriod) {
      const time12 = `${selectedHour.padStart(2, "0")}:${selectedMinute.padStart(2, "0")} ${selectedPeriod}`;
      const time24 = convertTo24Hour(time12);
      setSessionTime(time24);
    }
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // Convert current state to 24-hour format
  const convertStateToTime24 = (): string => {
    if (!selectedHour || !selectedMinute || !selectedPeriod) return "";

    let hour = parseInt(selectedHour);
    if (selectedPeriod === "AM" && hour === 12) hour = 0;
    if (selectedPeriod === "PM" && hour !== 12) hour += 12;

    return `${hour.toString().padStart(2, "0")}:${selectedMinute}`;
  };

  // Get display time
  const getDisplayTime = (): string => {
    if (selectedHour && selectedMinute && selectedPeriod) {
      return `${selectedHour.padStart(2, "0")}:${selectedMinute.padStart(2, "0")} ${selectedPeriod}`;
    }
    return "";
  };

  // Helper function to convert 12hr to 24hr format for storage
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return "";
    const [time, period] = time12.split(" ");
    const [hours, minutes] = time.split(":");
    let hour24 = parseInt(hours, 10);

    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, "0")}:${minutes}`;
  };

  // Helper function to convert 24hr to 12hr format for display
  const _convertTo12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Load mentor data
  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        // First try the individual mentor API
        let response = await fetch(`/api/mentor/${mentorId}`);
        let result = await response.json();

        if (result.success) {
          setMentorData(result.data);

          // Check user's existing sessions with this mentor
          try {
            const sessionResponse = await fetch(`/api/mentor/${mentorId}/sessions`);
            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
              setSessionStatus(sessionResult.data);
              setCanBookSession(sessionResult.data.canBookNewSession);

              if (!sessionResult.data.canBookNewSession) {
                toast.warning(
                  "You already have an active session with this mentor. Complete your current session before booking a new one."
                );
              }
            }
          } catch (sessionError) {
            console.error("Error checking sessions:", sessionError);
          }
        } else {
          // Fallback: try to find mentor in the approved mentors list
          console.log("Individual mentor API failed, trying fallback...");
          response = await fetch(`/api/mentor/get-approved-mentors`);
          result = await response.json();

          if (result.success) {
            const mentor = result.data.find((m: any) => m.id === mentorId);
            if (mentor) {
              setMentorData(mentor);
            } else {
              toast.error("Mentor not found");
              router.push("/dashboard");
            }
          } else {
            toast.error("Failed to load mentor data");
            router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error fetching mentor:", error);
        toast.error("Error loading mentor data");
        router.push("/dashboard");
      } finally {
        setLoadingMentor(false);
      }
    };

    fetchMentorData();
  }, [mentorId, router]);

  const handleBookSession = async () => {
    if (!sessionDate || !sessionTime) {
      toast.error("Please select session date and time");
      return;
    }

    if (!selectedHour || !selectedMinute || !selectedPeriod) {
      toast.error("Please select complete time (hour, minute, and AM/PM)");
      return;
    }

    if (!mentorData) {
      toast.error("Mentor data not loaded");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Starting session booking process...");
      console.log("📋 Booking data:", {
        mentorId,
        sessionDate,
        sessionTime: convertStateToTime24(),
        notes,
      });

      // Create booking order
      const response = await fetch("/api/mentor/book-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentorId,
          sessionDate,
          sessionTime: convertStateToTime24(),
          notes,
        }),
      });

      console.log("📡 Response status:", response.status);
      console.log("📄 Response ok:", response.ok);

      const data = await response.json();
      console.log("📋 Response data:", data);

      if (!data.success) {
        // Handle specific error cases
        if (response.status === 409) {
          toast.error(
            "You already have an active session with this mentor. Please complete your current session first."
          );
        } else if (response.status === 404) {
          toast.error("Mentor not found or unavailable for booking.");
        } else {
          toast.error(data.error || "Failed to create booking");
        }
        throw new Error(data.error || "Failed to create booking");
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.data.amount * 100, // Convert to paise
        currency: data.data.currency,
        order_id: data.data.orderId,
        name: "YogVaidya",
        description: `One-on-One Session with ${mentorData.name}`,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/mentor/verify-session-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                mentorId,
                sessionDate,
                sessionTime: convertStateToTime24(),
                notes,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              toast.success("Session booked successfully!");
              router.push("/dashboard?booking=success");
            } else {
              throw new Error(verifyResult.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: session?.user?.name || "User",
          email: session?.user?.email || "user@example.com",
        },
        theme: {
          color: "#5a9be9",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // @ts-expect-error importing Razorpay from cdn
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error booking session:", error);
      toast.error("Failed to initiate booking. Please try again.");
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  if (loadingMentor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading mentor details...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-red-700 font-medium text-lg mb-2">Mentor not found</p>
          <p className="text-gray-600 text-sm">
            The mentor you&apos;re looking for is currently unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Book Your Session</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Schedule Your One-on-One Session
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with your mentor for personalized guidance and expert insights
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mentor Information - Enhanced */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                        <AvatarImage src={mentorData.image} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-semibold">
                          {mentorData.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{mentorData.name}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{mentorData.mentorType}</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.9 Rating</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mentorData.experience && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Experience</p>
                        <p className="text-sm text-gray-600">
                          {mentorData.experience} years of expertise
                        </p>
                      </div>
                    </div>
                  )}

                  {mentorData.expertise && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Areas of Expertise
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {mentorData.expertise}
                      </p>
                    </div>
                  )}

                  {mentorData.certifications && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Certifications</h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {mentorData.certifications}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Pricing Display */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-1">Session Price</p>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <IndianRupeeIcon className="h-8 w-8 text-indigo-600" />
                        <span className="text-4xl font-bold text-indigo-600">
                          {mentorData.sessionPrice}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">per session</p>
                      <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        <Check className="h-3 w-3 mr-1" />
                        Best Value
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Verified Professional</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>24h Cancellation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Status Alert */}
              {sessionStatus && !canBookSession && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        Active Session In Progress
                      </h3>
                      <p className="text-yellow-700 mb-3">
                        You currently have {sessionStatus.activeSessionsCount} active session(s)
                        with this mentor. Please complete your current session before booking a new
                        one.
                      </p>
                      <div className="text-sm text-yellow-600">
                        <p>• Our pay-per-session model allows one active session at a time</p>
                        <p>• This ensures focused mentorship and fair access for all users</p>
                        <p>• Sessions are marked complete after they occur</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                {sessionStatus && canBookSession && sessionStatus.completedSessionsCount > 0 && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-xl mb-6">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="text-green-800 font-medium">
                        You&apos;ve completed {sessionStatus.completedSessionsCount} session(s) with
                        this mentor. Ready to book another!
                      </p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Session Details
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Choose your preferred date and time for the session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Date and Time Selection - Enhanced */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="sessionDate"
                        className="flex items-center gap-2 text-base font-semibold text-gray-700"
                      >
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Select Date
                      </Label>
                      <Input
                        id="sessionDate"
                        type="date"
                        min={today}
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                        disabled={!canBookSession}
                      />
                      <p className="text-sm text-gray-500">
                        {canBookSession
                          ? "Available dates from today onwards"
                          : "Complete your current session to book a new one"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="sessionTime"
                        className="flex items-center gap-2 text-base font-semibold text-gray-700"
                      >
                        <Clock className="h-5 w-5 text-indigo-600" />
                        Select Time
                      </Label>

                      {/* 12-Hour Time Picker */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Hour</Label>
                          <Select
                            value={selectedHour}
                            onValueChange={setSelectedHour}
                            disabled={!canBookSession}
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent>
                              {hours.map((hour) => (
                                <SelectItem key={hour.value} value={hour.value}>
                                  {hour.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Minute</Label>
                          <Select
                            value={selectedMinute}
                            onValueChange={setSelectedMinute}
                            disabled={!canBookSession}
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {minutes.map((minute) => (
                                <SelectItem key={minute.value} value={minute.value}>
                                  {minute.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Period</Label>
                          <Select
                            value={selectedPeriod}
                            onValueChange={setSelectedPeriod}
                            disabled={!canBookSession}
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((period) => (
                                <SelectItem key={period.value} value={period.value}>
                                  {period.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500">
                        {!canBookSession
                          ? "Time selection disabled - complete your current session first"
                          : getDisplayTime()
                            ? `Selected: ${getDisplayTime()}`
                            : "Choose your preferred time"}
                      </p>
                    </div>
                  </div>

                  {/* Notes Section - Enhanced */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-base font-semibold text-gray-700">
                      Session Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Share any specific topics you'd like to focus on, goals you want to achieve, or questions you have for your mentor..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="text-base border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canBookSession}
                    />
                    <p className="text-sm text-gray-500">
                      {canBookSession
                        ? "Help your mentor prepare by sharing your expectations and goals"
                        : "Notes section disabled - complete your current session to book a new one"}
                    </p>
                  </div>

                  {/* Enhanced Session Summary */}
                  {sessionDate && selectedHour && selectedMinute && selectedPeriod && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="h-6 w-6 text-green-600" />
                        <h4 className="text-lg font-bold text-green-800">Session Summary</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-700">Date</p>
                              <p className="text-green-800 font-semibold">
                                {formatDate(sessionDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-700">Time</p>
                              <p className="text-green-800 font-semibold">{getDisplayTime()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-700">Mentor</p>
                              <p className="text-green-800 font-semibold">{mentorData.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <IndianRupeeIcon className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Amount</p>
                              <p className="text-green-800 font-semibold text-xl">
                                ₹{mentorData.sessionPrice}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Payment Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleBookSession}
                      disabled={loading || !sessionDate || !sessionTime || !canBookSession}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                          <span>Processing Payment...</span>
                        </div>
                      ) : !canBookSession ? (
                        <div className="flex items-center gap-3">
                          <span>Complete Current Session First</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <IndianRupeeIcon className="h-6 w-6" />
                          <span>Pay ₹{mentorData.sessionPrice} & Book Session</span>
                        </div>
                      )}
                    </Button>

                    {/* Enhanced Security Notes */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="font-medium text-gray-800">Secure & Protected</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>SSL Encrypted Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>24h Reschedule Policy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Full Refund Protection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
