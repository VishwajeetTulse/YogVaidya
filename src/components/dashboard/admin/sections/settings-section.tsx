"use client";

import { useState, useEffect } from "react";
import { AdminSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, User, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client"; // Adjust the import based on your project structure

interface AdminSettings {
  mentorApplicationAlerts: boolean;
  userSignupAlerts: boolean;
  systemAlerts: boolean;
  paymentAlerts: boolean;
}

export const SettingsSection = ({ userDetails }: AdminSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    mentorApplicationAlerts: true,
    userSignupAlerts: true,
    systemAlerts: true,
    paymentAlerts: true,
  });
  const [displayName, setDisplayName] = useState(userDetails?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(userDetails?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/settings`);
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
  };
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

  const changePassword = async () => {
    // Reset previous error
    setPasswordError("");

    // Validate passwords
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update password");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Password updated successfully");
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update password";
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your admin dashboard preferences and system settings.
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
              value={userDetails?.role || "ADMIN"}
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
      {/* Update Password card */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        <Separator className="mb-6" />
        <Button onClick={handlechangePassword} className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white">
          Change/Reset Password
        </Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <Separator />
        {/*notification settings coming soon */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
          <p className="text-gray-600">
            We are working on adding notification settings to customize alerts
            for mentor applications, user signups, system events, and payments.
          </p>
        </div>
      </Card>
    </div>
  );
};
