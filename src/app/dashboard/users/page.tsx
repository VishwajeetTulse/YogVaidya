import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UserDashboard from "@/components/user-dashboard";

const dashboardPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }
  return (
    <>
      <UserDashboard />
    </>
  );
};

export default dashboardPage;
