"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { getUserDetails, UserDetails, printUserDetails } from "@/lib/userDetails";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Shield, User, Mail, Phone, Settings, Activity, Database, Eye, EyeOff } from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const { data: session } = useSession();  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserDetails();
    }
  }, [session]);

  const fetchUserDetails = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const result = await getUserDetails(session.user.id);
      if (result.success) {
        setUserDetails(result.user || null);
      } else {
        toast.error("Error", {
          description: result.error || "Failed to fetch user details"
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Error", {
        description: "Failed to fetch user details"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDetails = async () => {
    if (session?.user?.id) {
      await printUserDetails(session.user.id);
      toast.success("User details printed to console", {
        description: "Check the browser console or server logs for complete details"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.message("Signed out successfully", {
        description: "You have been signed out successfully.",
      });
      router.push("/");
    } catch (error) {
      toast.error("Error Signing Out", {
        description: "There is a problem in signing out",
      });
      console.log("Sign out error", error);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500 text-white";
      case "INACTIVE": return "bg-gray-500 text-white";
      case "CANCELLED": return "bg-red-500 text-white";
      case "EXPIRED": return "bg-orange-500 text-white";
      case "PENDING": return "bg-yellow-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "SEED": return "bg-gray-500 text-white";
      case "BLOOM": return "bg-purple-500 text-white";
      case "FLOURISH": return "bg-pink-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading user details...</span>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {userDetails?.name || "User"}!</p>
            </div>            <div className="flex gap-3">
              <Button
                onClick={handlePrintDetails}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Print to Console
              </Button>
              <Button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {showDebugInfo ? "Hide" : "Show"} Debug Info
              </Button>
              <Button
                onClick={() => setShowFullDetails(!showFullDetails)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showFullDetails ? "Hide" : "Show"} Full Details
              </Button>
              <Button onClick={handleSignOut} variant="destructive">
                Log Out
              </Button>
            </div>
          </div>
        </div>        {userDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="p-6 col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{userDetails.name || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userDetails.email}
                    {userDetails.emailVerified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {userDetails.phone || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <Badge className="bg-indigo-100 text-indigo-800">{userDetails.role}</Badge>
                    {userDetails.mentorType && (
                      <Badge className="bg-blue-100 text-blue-800">{userDetails.mentorType}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Subscription Information */}
            <Card className="p-6 col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Subscription</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlanColor(userDetails.subscriptionPlan)}>
                      {userDetails.subscriptionPlan}
                    </Badge>
                    {userDetails.isTrialActive && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Trial
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(userDetails.subscriptionStatus)}>
                    {userDetails.subscriptionStatus}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Billing Period</label>
                  <p className="text-gray-900">{userDetails.billingPeriod || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Amount</label>
                  <p className="text-gray-900 font-semibold">₹{userDetails.paymentAmount || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Auto Renewal</label>
                  <Badge variant={userDetails.autoRenewal ? "default" : "secondary"}>
                    {userDetails.autoRenewal ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Account Activity */}
            <Card className="p-6 col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Account Activity</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-gray-900">{formatDate(userDetails.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(userDetails.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Active Sessions</label>
                  <p className="text-gray-900">{userDetails.sessionsCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Linked Accounts</label>
                  <p className="text-gray-900">{userDetails.accountsCount}</p>
                </div>
              </div>
            </Card>

            {/* Debug Information Section */}
            {showDebugInfo && (
              <Card className="p-6 col-span-full border-2 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-800">🔍 Debug Information</h2>
                  <Badge variant="destructive" className="text-xs">
                    DEBUGGING MODE
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-700 border-b border-red-300 pb-2">Session Data</h3>
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <pre className="text-sm text-gray-800 overflow-auto">
                        {JSON.stringify(session, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Database Raw Data */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-700 border-b border-red-300 pb-2">Database Raw Data</h3>
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <pre className="text-sm text-gray-800 overflow-auto max-h-96">
                        {JSON.stringify(userDetails, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Environment & System Info */}
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="font-semibold text-red-700 border-b border-red-300 pb-2">System Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-medium text-red-600 mb-2">Client Info</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</p>
                          <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-medium text-red-600 mb-2">Component State</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Loading:</strong> {loading.toString()}</p>
                          <p><strong>Show Full Details:</strong> {showFullDetails.toString()}</p>
                          <p><strong>Show Debug Info:</strong> {showDebugInfo.toString()}</p>
                          <p><strong>User Details Loaded:</strong> {userDetails ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-medium text-red-600 mb-2">Data Integrity</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Session Valid:</strong> {session ? 'Yes' : 'No'}</p>
                          <p><strong>User ID Match:</strong> {session?.user?.id === userDetails?.id ? 'Yes' : 'No'}</p>
                          <p><strong>Email Verified:</strong> {userDetails?.emailVerified ? 'Yes' : 'No'}</p>
                          <p><strong>Subscription Active:</strong> {userDetails?.subscriptionStatus === 'ACTIVE' ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:col-span-2 pt-4 border-t border-red-300">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => console.log('Full User Details:', userDetails)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Log User Details
                      </Button>
                      <Button
                        onClick={() => console.log('Session Data:', session)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Log Session Data
                      </Button>
                      <Button
                        onClick={() => {
                          const debugData = {
                            timestamp: new Date().toISOString(),
                            userDetails,
                            session,
                            componentState: {
                              loading,
                              showFullDetails,
                              showDebugInfo
                            },
                            url: typeof window !== 'undefined' ? window.location.href : 'N/A'
                          };
                          console.log('Complete Debug Data:', debugData);
                          navigator.clipboard?.writeText(JSON.stringify(debugData, null, 2))
                            .then(() => alert('Debug data copied to clipboard!'))
                            .catch(() => alert('Failed to copy to clipboard'));
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Copy Debug Data
                      </Button>                      <Button
                        onClick={fetchUserDetails}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Refresh Data
                      </Button>
                      <Button
                        onClick={() => router.push('/debug')}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Open Full Debug Console
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Full Details Section */}
            {showFullDetails && (
              <Card className="p-6 col-span-full">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Complete User Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Subscription Dates */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Subscription Dates</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-gray-900">{formatDate(userDetails.subscriptionStartDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-gray-900">{formatDate(userDetails.subscriptionEndDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trial End</label>
                      <p className="text-gray-900">{formatDate(userDetails.trialEndDate)}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Payment Details</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Payment</label>
                      <p className="text-gray-900">{formatDate(userDetails.lastPaymentDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Next Billing</label>
                      <p className="text-gray-900">{formatDate(userDetails.nextBillingDate)}</p>
                    </div>
                  </div>

                  {/* Razorpay Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Razorpay Details</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subscription ID</label>
                      <p className="text-gray-900 text-xs font-mono break-all">
                        {userDetails.razorpaySubscriptionId || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer ID</label>
                      <p className="text-gray-900 text-xs font-mono break-all">
                        {userDetails.razorpayCustomerId || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-3 md:col-span-2 lg:col-span-3">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Technical Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">User ID</label>
                        <p className="text-gray-900 text-xs font-mono break-all">{userDetails.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profile Image</label>
                        <p className="text-gray-900">{userDetails.image || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw JSON Data */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3">Raw JSON Data</h3>
                  <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-800">
                      {JSON.stringify(userDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
