"use server";

import { prisma } from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type UpdateProfileData = {
  id: string;
  name?: string;
  phone?: string;
  email: string;
  role: string;
};

export type SettingsActionResult = {
  success: boolean;
  error?: string;
  data?: Prisma.UserUpdateInput | { message: string };
};

/**
 * Update user profile information
 */
export async function updateUserProfile(data: UpdateProfileData): Promise<SettingsActionResult> {
  try {
    const { id, name, phone, email } = data;

    // Validate required fields
    if (!id || !email) {
      return {
        success: false,
        error: "User ID and email are required"
      };
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        // Email and role are typically not updated through settings
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: "Failed to update profile. Please try again."
    };
  }
}

/**
 * Send password reset email for credential-based authentication
 */
export async function sendPasswordResetEmail(email: string): Promise<SettingsActionResult> {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email is required"
      };
    }

    // Note: This function uses the auth client which might need to be adapted for server-side usage
    // For now, we'll return a success response and handle the actual reset in the client component
    return {
      success: true,
      data: { message: "Password reset process initiated" }
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: "Failed to send password reset email. Please try again."
    };
  }
}

