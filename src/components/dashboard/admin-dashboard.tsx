"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/sidebar";
import { AdminSectionRenderer } from "./admin/section-renderer";
import { useAdminDashboard } from "./admin/hooks/use-admin-dashboard";

export default function AdminDashboard() {
  const {
    userDetails,
    loading,
    activeSection,
    setActiveSection,
    handleSignOut,
  } = useAdminDashboard();

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
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleSignOut={handleSignOut}
        userDetails={userDetails}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <h1 className="text-lg font-semibold text-gray-900">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AdminSectionRenderer
            activeSection={activeSection}
            userDetails={userDetails}
            setActiveSection={setActiveSection}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
