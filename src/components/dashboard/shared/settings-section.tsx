"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, User, Lock, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { updateUserProfile } from "@/lib/server/settings-server";
import { type UserDetails } from "@/lib/userDetails";

export interface SharedSettingsSectionProps {
  userDetails: UserDetails;
  role: "admin" | "mentor" | "user" | "moderator";
  roleLabel?: string;
}

export const SharedSettingsSection = ({
  userDetails,
  role,
  roleLabel,
}: SharedSettingsSectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(userDetails?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(userDetails?.phone || "");

  const handleChangePassword = async () => {
    try {
      const { error } = await authClient.forgetPassword({
        email: userDetails.email,
        redirectTo: "/reset-password",
      });
      if (!error) {
        toast.success("Password reset link sent to your email");
      } else {
        toast.error("Failed to send password reset link");
      }
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send password reset link");
    }
  };

  const handleUpdateProfile = async () => {
    startTransition(async () => {
      try {
        const result = await updateUserProfile({
          id: userDetails.id,
          name: displayName,
          phone: phoneNumber,
          email: userDetails.email,
          role: userDetails.role,
        });

        if (result.success) {
          toast.success("Profile updated successfully");
        } else {
          toast.error(result.error || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
      }
    });
  };

  const getRoleDisplayName = () => {
    if (roleLabel) return roleLabel;
    switch (role) {
      case "admin":
        return "Administrator";
      case "mentor":
        return "Yoga Instructor";
      case "moderator":
        return "Moderator";
      case "user":
        return "Student";
      default:
        return "User";
    }
  };

  const getPageDescription = () => {
    switch (role) {
      case "admin":
        return "Customize your admin dashboard preferences and system settings.";
      case "mentor":
        return "Configure your instructor preferences and account settings.";
      case "moderator":
        return "Manage your moderator preferences and account settings.";
      case "user":
        return "Customize your app preferences and account settings.";
      default:
        return "Configure your preferences and account settings.";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">{getPageDescription()}</p>
      </div>

      {/* Profile Information */}
      <Card className="p-6 shadow-sm">
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
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={getRoleDisplayName()} disabled={true} className="bg-gray-100" />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleUpdateProfile} disabled={isPending}>
            {isPending ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      </Card>

      {/* Password Change Card - Only for credential-based auth */}
      {userDetails.authtype === "credential" && (
        <Card className="p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <Separator className="mb-6" />
          <Button
            onClick={handleChangePassword}
            className="w-full md:w-1/3 bg-gray-800 hover:bg-gray-700 text-white"
          >
            Change/Reset Password
          </Button>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-4">
          {/* Notification settings under development */}
          <div className="text-gray-500 text-sm">
            <p className="mb-2">Notification settings are currently under development.</p>
            <p className="italic">
              Features like email notifications, push notifications, and role-specific alerts will
              be available in a future update.
            </p>
          </div>
        </div>
      </Card>

      {/* App Preferences - Only for user role */}
      {role === "user" && (
        <Card className="p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">App Preferences</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="text-gray-500 text-sm">
              <p className="mb-2">
                App preferences such as theme, language, and display options are currently under
                development.
              </p>
              <p className="italic">These features will be available in a future update.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
