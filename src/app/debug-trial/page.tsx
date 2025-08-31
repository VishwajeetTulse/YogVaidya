"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function TrialDebugPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile');
      const result = await response.json();
      
      if (result.success) {
        setUserInfo(result.user);
        toast.success("User info loaded");
      } else {
        toast.error("Failed to load user info");
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      toast.error("Error checking user status");
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/start-trial', { method: 'POST' });
      const result = await response.json();
      
      console.log('Trial result:', result);
      
      if (result.success) {
        toast.success("Trial start attempted - check console");
        // Refresh user info
        await checkUserStatus();
      } else {
        toast.error(`Trial failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error("Error starting trial");
    } finally {
      setLoading(false);
    }
  };

  const resetTrialStatus = async () => {
    setLoading(true);
    try {
      // This would require a special admin endpoint
      toast.info("Reset function not implemented - use database directly");
    } catch (error) {
      console.error('Error resetting trial:', error);
      toast.error("Error resetting trial");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Trial Debug</CardTitle>
            <CardDescription>Please sign in to debug trial functionality</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trial Debug Page</CardTitle>
          <CardDescription>Debug trial functionality for user: {session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkUserStatus} disabled={loading}>
              Check User Status
            </Button>
            <Button onClick={startTrial} disabled={loading} variant="outline">
              Start Trial
            </Button>
            <Button onClick={resetTrialStatus} disabled={loading} variant="destructive">
              Reset Trial (Admin)
            </Button>
          </div>
        </CardContent>
      </Card>

      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>ID:</strong> {userInfo.id}</div>
              <div><strong>Email:</strong> {userInfo.email}</div>
              <div><strong>Phone:</strong> {userInfo.phone || "Not set"}</div>
              <div><strong>Role:</strong> {userInfo.role}</div>
              <div><strong>Subscription Plan:</strong> {userInfo.subscriptionPlan || "None"}</div>
              <div><strong>Subscription Status:</strong> {userInfo.subscriptionStatus || "None"}</div>
              <div><strong>Trial Used:</strong> {userInfo.trialUsed ? "Yes" : "No"}</div>
              <div><strong>Trial Active:</strong> {userInfo.isTrialActive ? "Yes" : "No"}</div>
              <div><strong>Trial End Date:</strong> {userInfo.trialEndDate ? new Date(userInfo.trialEndDate).toLocaleString() : "None"}</div>
              <div><strong>Created At:</strong> {new Date(userInfo.createdAt).toLocaleString()}</div>
              <div><strong>Updated At:</strong> {new Date(userInfo.updatedAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Check User Status" to see current user state</li>
            <li>Click "Start Trial" to attempt starting a trial</li>
            <li>Check browser console for detailed logs</li>
            <li>Check server logs for backend debugging info</li>
            <li>If trial used is "Yes" but user never got a trial, there's an issue</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
