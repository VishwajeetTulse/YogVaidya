"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MentorSidebar } from "./mentor/sidebar";
import { MentorSectionRenderer } from "./mentor/section-renderer";
import { useMentorDashboard } from "./mentor/hooks/use-mentor-dashboard";

export default function MentorDashboard() {
  const {
    userDetails,
    loading,
    activeSection,
    setActiveSection,
    handleSignOut,
    formatDate,
  } = useMentorDashboard();

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
      <MentorSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleSignOut={handleSignOut}
        userDetails={userDetails}
      />
      <SidebarInset>
        <header className="flex h-16 md:hidden shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold text-gray-900">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <MentorSectionRenderer
            activeSection={activeSection}
            userDetails={userDetails}
            setActiveSection={setActiveSection}
            formatDate={formatDate}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
