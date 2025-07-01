import React from "react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { BaseSidebarProps } from "./types";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { type SidebarMenuItem as SidebarMenuItemType} from "../user/types";
import { SubscriptionCountdown } from "./subscription-countdown";

interface GenericSidebarProps extends BaseSidebarProps {
  dashboardTitle: string;
  menuItems: SidebarMenuItemType[];
  roleLabel?: string;
  getIcon?: (id: string) => React.ElementType;
}

export const GenericSidebar = ({
  activeSection,
  setActiveSection,
  handleSignOut,
  userDetails,
  dashboardTitle,
  menuItems,
  roleLabel,
  getIcon = () => LogOut,
}: GenericSidebarProps) => {

  return (
    <ShadcnSidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10  rounded-full flex items-center justify-center overflow-hidden">
            <AvatarImage src={userDetails?.image || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[#76d2fa] to-[#876aff] text-white">
              {userDetails?.name?.substring(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm truncate">
              {userDetails?.name || dashboardTitle}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {roleLabel || userDetails?.email || ""}
            </p>
          </div>
        </div>
      </SidebarHeader>{" "}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = getIcon(item.id) || LogOut;
                const isActive = activeSection === item.id;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
                      isActive={isActive}
                      className={`w-full flex items-center gap-3 px-3 py-5 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] text-white shadow-md hover:from-[#5a9be9] hover:to-[#76d2fa]"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isActive ? "text-white" : "text-gray-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium text-sm truncate",
                            isActive ? "text-white" : "text-gray-900"
                          )}
                        >
                          {item.title}
                        </p>
                        {item.description && (
                          <p
                            className={`text-xs truncate ${
                              isActive ? "text-white/70" : "text-gray-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SubscriptionCountdown userDetails={userDetails} />
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
