"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface AvailabilityData {
  id: string;
  name: string;
  isAvailable: boolean;
  role: string;
  mentorType: string;
}

export const MentorAvailabilityToggle = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time polling for availability updates
  const fetchAvailability = useCallback(async (showToast = false) => {
    try {
      const response = await fetch("/api/mentor/availability", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch availability status");
      }

      const data = await response.json();
      if (data.success) {
        setAvailabilityData(data.data);
        setLastUpdated(new Date());
        setIsConnected(true);
        
        if (showToast) {
          toast.success("Availability status refreshed");
        }
      } else {
        throw new Error(data.error || "Failed to fetch availability");
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setIsConnected(false);
      
      if (showToast) {
        toast.error("Failed to refresh availability status");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time toggle functionality
  const toggleAvailability = async (newStatus: boolean) => {
    setIsUpdating(true);
    const previousStatus = availabilityData?.isAvailable;
    
    // Optimistic update for immediate UI feedback
    if (availabilityData) {
      setAvailabilityData(prev => prev ? { ...prev, isAvailable: newStatus } : null);
    }

    try {
      const response = await fetch("/api/mentor/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      const data = await response.json();
      if (data.success) {
        // Update with server response
        setAvailabilityData(data.data);
        setLastUpdated(new Date());
        setIsConnected(true);
        
        toast.success(data.message, {
          description: `You are now ${newStatus ? 'available' : 'unavailable'} for sessions`,
          action: {
            label: "Undo",
            onClick: () => toggleAvailability(!newStatus),
          },
        });
        
        // Broadcast availability change (for future real-time features)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mentorAvailabilityChanged', {
            detail: { mentorId: data.data.id, isAvailable: newStatus }
          }));
        }
      } else {
        throw new Error(data.error || "Failed to update availability");
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      
      // Revert optimistic update on error
      if (availabilityData && previousStatus !== undefined) {
        setAvailabilityData(prev => prev ? { ...prev, isAvailable: previousStatus } : null);
      }
      
      setIsConnected(false);
      toast.error("Failed to update availability status", {
        description: "Please check your connection and try again",
        action: {
          label: "Retry",
          onClick: () => toggleAvailability(newStatus),
        },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Set up real-time polling
  useEffect(() => {
    fetchAvailability();
    
    // Poll every 30 seconds for real-time updates
    const pollInterval = setInterval(() => {
      if (!isUpdating) {
        fetchAvailability();
      }
    }, 30000);

    // Listen for page visibility changes to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && !isUpdating) {
        fetchAvailability();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAvailability, isUpdating]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchAvailability(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Availability Status
            <div className="ml-auto">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading availability status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availabilityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Availability Status
            <div className="ml-auto">
              <WifiOff className="w-4 h-4 text-red-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Failed to load availability status</p>
            <Button onClick={handleRefresh} variant="outline">
              <Loader2 className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Real-time Availability
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isUpdating}
              className="h-6 w-6 p-0"
            >
              <Loader2 className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Status Display */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-lg transition-colors",
          availabilityData.isAvailable 
            ? "bg-green-50 border-2 border-green-200" 
            : "bg-red-50 border-2 border-red-200"
        )}>
          <div className="flex items-center gap-3">
            {availabilityData.isAvailable ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                Currently {availabilityData.isAvailable ? "Available" : "Unavailable"}
              </p>
              <p className="text-sm text-gray-600">
                {availabilityData.isAvailable 
                  ? "Students can book sessions with you" 
                  : "Students cannot book new sessions with you"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {availabilityData.isAvailable ? "On" : "Off"}
            </span>
            <Switch
              checked={availabilityData.isAvailable}
              onCheckedChange={toggleAvailability}
              disabled={isUpdating}
              className={cn(
                "transition-all duration-200",
                isUpdating && "opacity-50"
              )}
            />
            {isUpdating && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
        </div>

        {/* Real-time Information */}
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-900 mb-2">Real-time Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Instant Updates</strong>: Changes reflect immediately across all platforms</li>
            <li>• <strong>Auto-refresh</strong>: Status updates every 30 seconds automatically</li>
            <li>• <strong>Offline Detection</strong>: Shows connection status and handles network issues</li>
            <li>• <strong>Optimistic UI</strong>: Immediate visual feedback while updating</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant={availabilityData.isAvailable ? "outline" : "default"}
            onClick={() => toggleAvailability(true)}
            disabled={isUpdating || availabilityData.isAvailable}
            className="flex-1"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Go Available
          </Button>
          <Button
            variant={!availabilityData.isAvailable ? "outline" : "secondary"}
            onClick={() => toggleAvailability(false)}
            disabled={isUpdating || !availabilityData.isAvailable}
            className="flex-1"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Go Unavailable
          </Button>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Connection Issue</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Unable to sync with server. Changes may not be saved.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
