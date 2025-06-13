import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";
import { MODERATOR_SIDEBAR_MENU_ITEMS } from "./constants";
import { ModeratorSidebarMenuItem } from "./types";
import { cn } from "@/lib/utils";

interface ModeratorSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
  userDetails: any;
}

export const ModeratorSidebar = ({
  activeSection,
  setActiveSection,
  handleSignOut,
  userDetails,
}: ModeratorSidebarProps) => {
  return (
    <ShadcnSidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {userDetails?.name?.charAt(0) || "M"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm truncate">
              {userDetails?.name || "Moderator"}
            </h2>
            <p className="text-xs text-gray-500 truncate">Platform Moderator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {MODERATOR_SIDEBAR_MENU_ITEMS.map(
                (item: ModeratorSidebarMenuItem) => {
                  const Icon = item.icon;
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
                          <p
                            className={`text-xs truncate ${
                              isActive ? "text-white/70" : "text-gray-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full justify-start px-3 py-5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
