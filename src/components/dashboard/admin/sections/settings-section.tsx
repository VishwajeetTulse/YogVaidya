"use client";

import { useState, useEffect } from "react";
import { AdminSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Shield, User, Server, Lock } from "lucide-react";

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

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
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
      }    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
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

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <Separator className="mb-6" />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
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
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="paymentAlerts" 
              checked={settings.paymentAlerts}
              onCheckedChange={(checked) => {
                setSettings({
                  ...settings,
                  paymentAlerts: checked === true
                });
              }}
              disabled={isLoading || isSaving}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="paymentAlerts" className="text-sm font-medium">
                Payment Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important payment events and issues
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="systemAlerts" 
              checked={settings.systemAlerts}
              onCheckedChange={(checked) => {
                setSettings({
                  ...settings,
                  systemAlerts: checked === true
                });
              }}
              disabled={isLoading || isSaving}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="systemAlerts" className="text-sm font-medium">
                System Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about system events and potential issues
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button 
            onClick={saveSettings} 
            disabled={isLoading || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>
        <Separator className="mb-6" />

        <div className="space-y-4">
          <div className="text-gray-500 text-sm">
            <p className="mb-2">
              System settings configuration is currently under development.
            </p>
            <p className="italic">Additional system controls will be available soon.</p>
          </div>
        </div>
      </Card>      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Security Settings</h2>
        </div>
        <Separator className="mb-6" />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Update your password to maintain account security.
            </p>
            
            {passwordError && (
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    disabled={isLoading || isChangingPassword}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading || isChangingPassword}
                  />
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isLoading || isChangingPassword}
                  />
                </div>
              </div>
              
              <div>
                <Button 
                  onClick={changePassword}
                  disabled={isLoading || isChangingPassword}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Advanced Security</h3>
            <div className="text-gray-500 text-sm">
              <p className="mb-2">
                Additional security settings and configuration options will be available in a future update.
              </p>
              <p className="italic">Please check back later for enhanced security controls.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
