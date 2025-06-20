"use client";

import { useState, useEffect } from "react";
import { ModeratorSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, User } from "lucide-react";
import { authClient } from "@/lib/auth-client"; // Adjust the import based on your project structure
interface ModeratorSettings {
  mentorApplicationAlerts: boolean;
  userSignupAlerts: boolean;
}
  
export const SettingsSection = ({ userDetails }: ModeratorSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ModeratorSettings>({
    mentorApplicationAlerts: true,
    userSignupAlerts: false,
  });
  const [displayName, setDisplayName] = useState(userDetails?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(userDetails?.phone || "");

  
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/moderator/settings`);
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handlechangePassword = async () => {
        const { error } = await authClient.forgetPassword({
          email: userDetails.email,
          redirectTo: "/reset-password",
        });
    if (!error) {
      toast.success("Password reset link sent to your email");
    } else {
      toast.error("Failed to send password reset link");
    }
      }
  const updateProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userDetails.id,
          name: displayName,
          phone: phoneNumber,
          email: userDetails.email,
          role: userDetails.role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your moderator dashboard preferences.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </div>
        <Separator className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={userDetails?.email || ""}
              disabled={true}
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your phone number"
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={userDetails?.role || "MODERATOR"}
              disabled={true}
              className="bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={updateProfile} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-4">
          {/* <div className="flex items-center space-x-2">
            <Checkbox 
              id="mentorApplicationAlerts" 
              checked={settings.mentorApplicationAlerts}
              onCheckedChange={(checked) => {
                setSettings({
                  ...settings,
                  mentorApplicationAlerts: checked === true
                });
              }}
              disabled={isLoading || isSaving}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="mentorApplicationAlerts" className="text-sm font-medium">
                Mentor Application Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new mentor applications are submitted
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="userSignupAlerts" 
              checked={settings.userSignupAlerts}
              onCheckedChange={(checked) => {
                setSettings({
                  ...settings,
                  userSignupAlerts: checked === true
                });
              }}
              disabled={isLoading || isSaving}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="userSignupAlerts" className="text-sm font-medium">
                User Signup Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new users register on the platform
              </p>
            </div>
          </div> */}

          {/* Notification section is under Construction */}
          <div className="text-gray-500 text-sm">
            <p className="mb-2">
              Notification settings are currently under construction.
            </p>
            <p className="italic">Please check back later for updates.</p>
          </div>
        </div>
      </Card>

      {/* <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={isLoading || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div> */}
      <Button onClick={handlechangePassword}>
        Reset Password
      </Button>
    </div>
  );
};
