"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { getUserDetails, UserDetails } from "@/lib/userDetails";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Database,
  Globe,
  TrendingUp,
  DollarSign,
  FileText,
  Mail,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarInset,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserDetails();
    }
  }, [session]);

  const fetchUserDetails = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const result = await getUserDetails(session.user.id);
      if (result.success) {
        setUserDetails(result.user || null);
      } else {
        toast.error("Error", {
          description: result.error || "Failed to fetch user details",
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Error", {
        description: "Failed to fetch user details",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.message("Signed out successfully", {
        description: "You have been signed out successfully.",
      });
      router.push("/");
    } catch (error) {
      toast.error("Error Signing Out", {
        description: "There is a problem in signing out",
      });
    }
  };

  const SidebarMenuItems = [
    {
      id: "overview",
      title: "Overview",
      icon: BarChart3,
      description: "System overview & stats",
    },
    {
      id: "users",
      title: "User Management",
      icon: Users,
      description: "Manage all platform users",
    },
    {
      id: "moderators",
      title: "Moderator Management",
      icon: Shield,
      description: "Manage moderators",
    },
    {
      id: "system",
      title: "System Health",
      icon: Activity,
      description: "Monitor system status",
    },
    {
      id: "analytics",
      title: "Platform Analytics",
      icon: TrendingUp,
      description: "Detailed platform insights",
    },
    {
      id: "database",
      title: "Database",
      icon: Database,
      description: "Database management",
    },
    {
      id: "settings",
      title: "System Settings",
      icon: Settings,
      description: "Global configurations",
    },
    {
      id: "support",
      title: "Help & Support",
      icon: HelpCircle,
      description: "Admin documentation",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "users":
        return renderUsers();
      case "moderators":
        return renderModerators();
      case "system":
        return renderSystem();
      case "analytics":
        return renderAnalytics();
      case "database":
        return renderDatabase();
      case "settings":
        return renderSettings();
      case "support":
        return renderSupport();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, Administrator!
        </h1>
        <p className="text-gray-600 mt-2">
          Complete system overview and administrative controls for YogVaidya platform.
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-semibold">2,847</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Mentors</p>
              <p className="text-xl font-semibold">156</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-semibold">₹8.4L</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">System Health</p>
              <p className="text-xl font-semibold">99.8%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Database</span>
            </div>
            <Badge className="bg-green-500 text-white">Healthy</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">API Services</span>
            </div>
            <Badge className="bg-green-500 text-white">Running</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">Cache Server</span>
            </div>
            <Badge className="bg-yellow-500 text-white">Optimizing</Badge>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            { action: "New mentor application", user: "Dr. Sarah Johnson", time: "2 minutes ago" },
            { action: "User subscription upgrade", user: "John Smith", time: "15 minutes ago" },
            { action: "System backup completed", user: "System", time: "1 hour ago" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("users")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-gray-500">User administration</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("analytics")}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-500">Platform insights</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/5 to-[#a792fb]/5 border border-[#876aff]/30"
          onClick={() => setActiveSection("system")}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">System Health</p>
              <p className="text-sm text-gray-500">Monitor platform</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive user administration and account management.
        </p>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#76d2fa]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#76d2fa]">2,847</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="text-center p-4 bg-[#ff7dac]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#ff7dac]">156</div>
            <div className="text-sm text-gray-500">Mentors</div>
          </div>
          <div className="text-center p-4 bg-[#876aff]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#876aff]">2,685</div>
            <div className="text-sm text-gray-500">Students</div>
          </div>
          <div className="text-center p-4 bg-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-500">Moderators</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderModerators = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderator Management</h1>
        <p className="text-gray-600 mt-2">Manage platform moderators and their permissions.</p>
      </div>
      <Card className="p-6">
        <p className="text-center text-gray-500">Moderator management interface would be implemented here</p>
      </Card>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-600 mt-2">Monitor platform performance and system status.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <h3 className="font-semibold mb-2">Server Uptime</h3>
          <div className="text-2xl font-bold text-[#76d2fa]">99.8%</div>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <h3 className="font-semibold mb-2">Response Time</h3>
          <div className="text-2xl font-bold text-[#ff7dac]">234ms</div>
          <p className="text-sm text-gray-500">Average API response</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <h3 className="font-semibold mb-2">Active Sessions</h3>
          <div className="text-2xl font-bold text-[#876aff]">1,247</div>
          <p className="text-sm text-gray-500">Current active users</p>
        </Card>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive platform insights and performance metrics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <h3 className="font-semibold mb-2">User Growth</h3>
          <div className="text-2xl font-bold text-[#76d2fa]">+23%</div>
          <p className="text-sm text-gray-500">This month</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <h3 className="font-semibold mb-2">Revenue Growth</h3>
          <div className="text-2xl font-bold text-[#ff7dac]">+18%</div>
          <p className="text-sm text-gray-500">Monthly recurring</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <h3 className="font-semibold mb-2">Session Completion</h3>
          <div className="text-2xl font-bold text-[#876aff]">94%</div>
          <p className="text-sm text-gray-500">Average completion rate</p>
        </Card>
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
        <p className="text-gray-600 mt-2">Database administration and maintenance tools.</p>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Database Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">Connection</div>
            <div className="text-sm text-green-600">Healthy</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">Storage</div>
            <div className="text-sm text-blue-600">78% Used</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-semibold">Performance</div>
            <div className="text-sm text-purple-600">Optimal</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Global platform configurations and preferences.</p>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Enable platform maintenance mode</p>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New User Registration</p>
              <p className="text-sm text-gray-500">Allow new user registrations</p>
            </div>
            <div className="w-12 h-6 bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">Administrative documentation and support resources.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Documentation</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">Admin User Guide</p>
              <p className="text-sm text-gray-500">Complete administrative documentation</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">System Architecture</p>
              <p className="text-sm text-gray-500">Technical system overview</p>
            </button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#76d2fa]" />
              <div>
                <p className="font-medium">System Administrator</p>
                <p className="text-sm text-gray-500">admin@yogvaidya.com</p>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[#876aff] to-[#a792fb] hover:from-[#a792fb] hover:to-[#876aff]">Emergency Support</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76d2fa] mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Sidebar */}
      <Sidebar className="w-64 bg-white shadow-lg border-r border-purple-100">
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">{userDetails?.name || "Administrator"}</h2>
              <p className="text-xs text-gray-500">
                System Admin
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>
              <span className="text-sm font-semibold text-gray-600 mb-2">
                Admin Dashboard
              </span>
            </SidebarGroupLabel>
            <SidebarMenu>
              {SidebarMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeSection === item.id}
                  >
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(item.id);
                      }}
                      className="cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild
                className="text-red-600 hover:bg-red-50"
              >
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSignOut();
                  }}
                  className="cursor-pointer"
                >
                  <LogOut />
                  <span>Sign Out</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset className="flex-1">
        <div className="p-6">{renderContent()}</div>
      </SidebarInset>
    </div>
  );
}
