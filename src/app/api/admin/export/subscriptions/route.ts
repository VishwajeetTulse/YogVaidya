import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";

import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new AuthorizationError("Access denied");
    }

    // Fetch all users with subscription data
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        billingPeriod: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialUsed: true,
        isTrialActive: true,
        trialEndDate: true,
        paymentAmount: true,
        autoRenewal: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter to only show actual customers (USER role)
    const filteredUsers = users.filter((u) => u.role === "USER");

    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Subscription Plan",
      "Subscription Status",
      "Billing Period",
      "Started",
      "Expires",
      "Trial Used",
      "Trial Active",
      "Trial Ends",
      "Payment Amount",
      "Auto Renewal",
      "Member Since",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.name || "",
          user.email,
          user.phone || "",
          user.role,
          user.subscriptionPlan || "",
          user.subscriptionStatus || "",
          user.billingPeriod || "",
          user.subscriptionStartDate
            ? new Date(user.subscriptionStartDate).toLocaleDateString("en-IN")
            : "",
          user.subscriptionEndDate
            ? new Date(user.subscriptionEndDate).toLocaleDateString("en-IN")
            : "",
          user.trialUsed ? "Yes" : "No",
          user.isTrialActive ? "Yes" : "No",
          user.trialEndDate ? new Date(user.trialEndDate).toLocaleDateString("en-IN") : "",
          user.paymentAmount || "0",
          user.autoRenewal ? "Yes" : "No",
          new Date(user.createdAt).toLocaleDateString("en-IN"),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscriptions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export subscriptions",
      },
      { status: 500 }
    );
  }
}
