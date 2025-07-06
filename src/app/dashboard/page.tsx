import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/config/auth";
import UserDashboard from "@/components/dashboard/unified/user-dashboard";
import MentorDashboard from "@/components/dashboard/unified/mentor-dashboard";
import ModeratorDashboard from "@/components/dashboard/unified/moderator-dashboard";
import AdminDashboard from "@/components/dashboard/unified/admin-dashboard";

const dashboardPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }  // Role-based rendering
  switch (session.user?.role) {
    case "MENTOR":
      // Now using a unified mentor dashboard for all mentor types
      return <MentorDashboard />;
    case "MODERATOR":
      return <ModeratorDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default dashboardPage;

