"use client";

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { LoadingSpinner } from './loading-spinner';
import { BaseDashboardProps } from './types';

export const BaseDashboard = ({
  loading,
  activeSection,
  children,
  sidebar,
  sectionRenderer,
}: BaseDashboardProps) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        <header className="flex h-16 md:hidden shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold text-gray-900">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {sectionRenderer}
        </div>
      </SidebarInset>
      {children}
    </SidebarProvider>
  );
};

