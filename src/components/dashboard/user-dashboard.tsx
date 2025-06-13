"use client";

import { Sidebar } from "./user/sidebar";
import { SectionRenderer } from "./user/section-renderer";
import { useUserDashboard } from "./user/hooks/use-user-dashboard";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function UserDashboard() {
  const {
    userDetails,
    loading,
    activeSection,
    setActiveSection,
    cancellingSubscription,
    billingPeriod,
    setBillingPeriod,
    viewMode,
    setViewMode,
    handleSignOut,
    handleCancelSubscription,
  } = useUserDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#76d2fa] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleSignOut={handleSignOut}
        userDetails={userDetails}
      />
      <SidebarInset>
        <header className="flex h-16 md:hidden shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold text-gray-900">
            {activeSection.charAt(0).toUpperCase() +
              activeSection.slice(1).replace("-", " ")}
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <SectionRenderer
            activeSection={activeSection}
            userDetails={userDetails}
            setActiveSection={setActiveSection}
            billingPeriod={billingPeriod}
            setBillingPeriod={setBillingPeriod}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cancellingSubscription={cancellingSubscription}
            handleCancelSubscription={handleCancelSubscription}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
