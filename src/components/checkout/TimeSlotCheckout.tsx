'use client'
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Calendar, Clock, User, IndianRupeeIcon, Phone, Mail, Award, Star, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  sessionType: 'YOGA' | 'MEDITATION' | 'DIET';
  maxStudents: number;
  currentStudents: number;
  isBooked: boolean;
  price: number;
  notes: string;
  sessionLink: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    mentorType: string;
    image?: string;
    sessionPrice?: number;
  };
}

export default function TimeSlotCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const timeSlotId = searchParams.get('timeSlotId');
  const mentorId = searchParams.get('mentorId');
  
  const [loading, setLoading] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const [notes, setNotes] = useState('');

  // Load time slot data
  useEffect(() => {
    const fetchTimeSlot = async () => {
      if (!timeSlotId) {
        toast.error("No time slot selected");
        router.push("/dashboard");
        return;
      }

      try {
        const response = await fetch(`/api/mentor/timeslots/${timeSlotId}`);
        const result = await response.json();
        
        if (result.success) {
          setTimeSlot(result.data);
          
          // Check if slot is still available
          if (result.data.isBooked) {
            toast.error("This time slot has already been booked");
            router.push("/dashboard");
            return;
          }
        } else {
          toast.error("Failed to load time slot details");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching time slot:", error);
        toast.error("Error loading time slot data");
        router.push("/dashboard");
      } finally {
        setLoadingSlot(false);
      }
    };

    fetchTimeSlot();
  }, [timeSlotId, router]);

  const handleBookTimeSlot = async () => {
    if (!timeSlot) {
      toast.error("Time slot data not loaded");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Please sign in to book a session");
      router.push("/signin");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Starting time slot booking process...");
      
      // First, create the booking (this reserves the slot)
      const bookingResponse = await fetch(`/api/mentor/timeslots/${timeSlotId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
        }),
      });

      console.log("📡 Booking response status:", bookingResponse.status);
      
      const bookingData = await bookingResponse.json();
      console.log("📋 Booking response data:", bookingData);

      if (!bookingData.success) {
        // Handle specific error cases
        if (bookingResponse.status === 409) {
          toast.error("You already have an active session with this mentor. Please complete your current session first.");
        } else if (bookingResponse.status === 404) {
          toast.error("Time slot not available anymore.");
        } else {
          toast.error(bookingData.error || 'Failed to reserve time slot');
        }
        throw new Error(bookingData.error || 'Failed to reserve time slot');
      }

      // Now create payment order
      const paymentResponse = await fetch('/api/mentor/create-session-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.data.bookingId,
          amount: timeSlot.price || timeSlot.mentor.sessionPrice || 500,
          mentorId: timeSlot.mentor.id,
          timeSlotId: timeSlotId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        // If payment creation fails, we should cancel the booking
        await fetch(`/api/mentor/timeslots/${timeSlotId}/book`, {
          method: 'DELETE',
        });
        
        toast.error(paymentData.error || 'Failed to create payment order');
        throw new Error(paymentData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentData.data.amount * 100, // Convert to paise
        currency: paymentData.data.currency,
        order_id: paymentData.data.orderId,
        name: "YogVaidya",
        description: `${timeSlot.sessionType} Session with ${timeSlot.mentor.name}`,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/mentor/verify-timeslot-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingData.data.bookingId,
                timeSlotId: timeSlotId,
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
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      // @ts-expect-error importing Razorpay from CDN
      const razorpay = new (window).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Error booking time slot:", error);
      toast.error("Failed to process booking. Please try again.");
      setLoading(false);
    }
  };

  // Helper functions
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'YOGA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDITATION': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DIET': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDuration = () => {
    if (!timeSlot) return '';
    const start = new Date(timeSlot.startTime);
    const end = new Date(timeSlot.endTime);
    const diff = end.getTime() - start.getTime();
    const minutes = Math.round(diff / (1000 * 60));
    return `${minutes} minutes`;
  };

  if (loadingSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!timeSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(timeSlot.startTime);
  const endDateTime = formatDateTime(timeSlot.endTime);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Session</h1>
              <p className="text-gray-600">Complete your booking and payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Session Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mentor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    Your Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={timeSlot.mentor.image} />
                      <AvatarFallback>
                        {timeSlot.mentor.name?.charAt(0) || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{timeSlot.mentor.name}</h3>
                      <p className="text-gray-600 capitalize">{timeSlot.mentor.mentorType?.toLowerCase().replace('mentor', ' Mentor')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{timeSlot.mentor.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Session Type</Label>
                      <Badge className={`mt-1 ${getSessionTypeColor(timeSlot.sessionType)}`}>
                        {timeSlot.sessionType}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Duration</Label>
                      <p className="mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {getDuration()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{startDateTime.date}</p>
                      <p className="text-sm text-gray-600">{startDateTime.time} - {endDateTime.time}</p>
                    </div>
                  </div>

                  {timeSlot.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Session Notes</Label>
                      <p className="mt-1 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        {timeSlot.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes (Optional)</CardTitle>
                  <CardDescription>
                    Any special requirements or questions for your mentor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any special requirements, health conditions, or questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IndianRupeeIcon className="w-5 h-5 text-green-600" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session Fee</span>
                      <span className="font-medium">₹{timeSlot.price || timeSlot.mentor.sessionPrice || 999}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-medium">₹0</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount</span>
                      <span className="text-green-600">₹{timeSlot.price || timeSlot.mentor.sessionPrice || 999}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>24/7 support</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookTimeSlot}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <IndianRupeeIcon className="w-4 h-4 mr-2" />
                        Pay & Book Session
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By booking, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
