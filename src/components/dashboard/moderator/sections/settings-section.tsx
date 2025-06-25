"use client";

import { useState } from "react";
import { ModeratorSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, User, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client"; // Adjust the import based on your project structure

export const SettingsSection = ({ userDetails }: ModeratorSectionProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(userDetails?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(userDetails?.phone || "");
console.log("User Details:", userDetails);

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
              disabled={isSaving}
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
              disabled={isSaving}
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
          <Button onClick={updateProfile} disabled={isSaving}>
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      </Card>
      {/* Update Password card */}
      {userDetails.authtype === "credential" && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <Separator className="mb-6" />
          <Button
            onClick={handlechangePassword}
            className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white"
          >
            Change/Reset Password
          </Button>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-4">
          {/* Notification section is under Construction */}
          <div className="text-gray-500 text-sm">
            <p className="mb-2">
              Notification settings are currently under construction.
            </p>
            <p className="italic">Please check back later for updates.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
