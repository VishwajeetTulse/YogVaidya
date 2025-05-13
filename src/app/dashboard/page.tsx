import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UserDashboard from "@/components/dashboard/user-dashboard";
import MentorDashboard from "@/components/dashboard/mentor-dashboard";
import YogaMentorDashboard from "@/components/dashboard/yoga-mentor-dashboard";
import ModeratorDashboard from "@/components/dashboard/moderator-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

const dashboardPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }
  // Role-based rendering
  switch (session.user?.role) {
    case "MENTOR":
      if (session.user?.mentorType === "YOGAMENTOR") {
        return <YogaMentorDashboard />;
      } else {
        return <MentorDashboard />;
      }
    case "MODERATOR":
      return <ModeratorDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default dashboardPage;
