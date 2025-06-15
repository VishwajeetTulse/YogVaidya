"use client";

import React from 'react';
import { BaseDashboard } from './base-dashboard';
import { GenericSidebar } from './sidebar-base';
import { GenericSectionRenderer } from './generic-section-renderer';
import { useDashboard } from './use-dashboard';
import { SectionConfig } from './types';

export interface UnifiedDashboardProps {
  role: string;
  dashboardTitle: string;
  sectionComponentMap: Record<string, React.ComponentType<any>>;
  menuItems: any[];
  roleLabel?: string;
  initialActiveSection?: string;
  getIcon?: (id: string) => React.ElementType;
  extendedHook?: (baseHookResult: any) => any;
}

export const UnifiedDashboard = ({
  dashboardTitle,
  menuItems,
  sectionComponentMap,
  roleLabel,
  initialActiveSection = "overview",
  getIcon,
  extendedHook,
}: UnifiedDashboardProps) => {
  // Use the base dashboard hook
  const baseHookResult = useDashboard(initialActiveSection);
  
  // Use extended hook if provided
  const hookResult = extendedHook ? extendedHook(baseHookResult) : baseHookResult;
  
  const { 
    userDetails,
    loading, 
    activeSection,
    setActiveSection,
    handleSignOut,
    ...otherProps
  } = hookResult;

  // Helper function to get an icon for a section ID if not provided
  const getIconForSection = (id: string) => {
    if (getIcon) return getIcon(id);
    
    // Find the menu item with this ID
    const menuItem = menuItems.find(item => item.id === id);
    return menuItem?.icon;
  };

  const sidebar = (
    <GenericSidebar
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      handleSignOut={handleSignOut}
      userDetails={userDetails}
      dashboardTitle={dashboardTitle}
      menuItems={menuItems}
      roleLabel={roleLabel}
      getIcon={getIconForSection}
    />
  );
  // Convert menuItems to SectionConfig format for the renderer
  const sections: SectionConfig[] = menuItems.map(item => ({
    id: item.id,
    label: item.title,
    roles: item.roles || []
  }));
  
  const sectionRenderer = (
    <GenericSectionRenderer
      activeSection={activeSection}
      userDetails={userDetails}
      setActiveSection={setActiveSection}
      sections={sections}
      sectionComponentMap={sectionComponentMap}
      {...otherProps}
    />
  );

  return (
    <BaseDashboard
      loading={loading}
      activeSection={activeSection}
      sidebar={sidebar}
      sectionRenderer={sectionRenderer}
    />
  );
};
