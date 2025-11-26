"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  User,
  IndianRupeeIcon,
  Award,
  Star,
  ArrowRight,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
  const _getDisplayTime = (): string => {
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

  // Helper function to format date
  const _formatDate = (dateString: string): string => {
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
          response = await fetch(`/api/mentor/get-approved-mentors`);
          result = await response.json();

          if (result.success) {
            const mentor = result.data.find((m: MentorData) => m.id === mentorId);
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

  const getMentorColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("yoga"))
      return {
        bg: "bg-violet-50",
        text: "text-violet-700",
        border: "border-violet-200",
        accent: "bg-violet-600",
        lightBg: "bg-violet-50/50",
      };
    if (lowerType.includes("meditation"))
      return {
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
        accent: "bg-sky-600",
        lightBg: "bg-sky-50/50",
      };
    if (lowerType.includes("diet") || lowerType.includes("nutrition"))
      return {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-200",
        accent: "bg-pink-600",
        lightBg: "bg-pink-50/50",
      };
    return {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      accent: "bg-slate-600",
      lightBg: "bg-slate-50/50",
    };
  };

  const mentorColor = mentorData ? getMentorColor(mentorData.mentorType) : getMentorColor("");

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
          amount: mentorData.sessionPrice,
        }),
      });

      const data = await response.json();

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
          color: "#0F172A",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mentor details...</p>
        </div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Mentor not found</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                Schedule Your Session
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect with {mentorData.name} for personalized guidance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Mentor Information */}
            <div className="lg:col-span-4">
              <Card
                className={`sticky top-8 border-2 ${mentorColor.border} shadow-lg shadow-primary/5`}
              >
                <CardHeader className={`pb-4 ${mentorColor.bg} rounded-t-xl`}>
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 ring-4 ring-background shadow-md">
                      <AvatarImage src={mentorData.image} />
                      <AvatarFallback
                        className={`text-2xl ${mentorColor.lightBg} ${mentorColor.text}`}
                      >
                        {mentorData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">{mentorData.name}</CardTitle>
                    <CardDescription className={`font-medium ${mentorColor.text} mt-1`}>
                      {mentorData.mentorType}
                    </CardDescription>
                    <div className="flex items-center mt-2 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      4.9 Rating
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4 text-sm">
                    {mentorData.experience && (
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${mentorColor.lightBg} rounded-lg`}>
                          <Award className={`h-4 w-4 ${mentorColor.text} mt-0.5`} />
                        </div>
                        <div>
                          <p className="font-medium">Experience</p>
                          <p className="text-muted-foreground">{mentorData.experience} years</p>
                        </div>
                      </div>
                    )}

                    {mentorData.expertise && (
                      <div className="space-y-1">
                        <p className="font-medium">Expertise</p>
                        <p className="text-muted-foreground">{mentorData.expertise}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Session Price</p>
                    <div className={`flex items-center justify-center gap-1 ${mentorColor.text}`}>
                      <IndianRupeeIcon className="h-5 w-5" />
                      <span className="text-3xl font-bold">{mentorData.sessionPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-8 space-y-6">
              {/* Session Status Alert */}
              {sessionStatus && !canBookSession && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Active Session In Progress</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      You currently have an active session with this mentor. Please complete it
                      before booking a new one.
                    </p>
                  </div>
                </div>
              )}

              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>
                    Choose your preferred date and time for the session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionDate">Select Date</Label>
                      <Input
                        id="sessionDate"
                        type="date"
                        min={today}
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        disabled={!canBookSession}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Select Time</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={selectedHour}
                          onValueChange={setSelectedHour}
                          disabled={!canBookSession}
                        >
                          <SelectTrigger>
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

                        <Select
                          value={selectedMinute}
                          onValueChange={setSelectedMinute}
                          disabled={!canBookSession}
                        >
                          <SelectTrigger>
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

                        <Select
                          value={selectedPeriod}
                          onValueChange={setSelectedPeriod}
                          disabled={!canBookSession}
                        >
                          <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Session Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Share any specific topics or questions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      disabled={!canBookSession}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4 border-t bg-muted/20 pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-2xl font-bold flex items-center">
                        <IndianRupeeIcon className="h-5 w-5" />
                        {mentorData.sessionPrice}
                      </p>
                    </div>
                    <Button
                      onClick={handleBookSession}
                      disabled={loading || !sessionDate || !sessionTime || !canBookSession}
                      size="lg"
                      className={`w-full md:w-auto ${mentorColor.accent} hover:opacity-90`}
                    >
                      {loading ? "Processing..." : "Pay & Book Session"}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Full Refund Protection
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
