"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import React, { useEffect, useState } from "react";
import ModeratorUserManagement from "@/components/dashboard/moderator-user-management";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  TrendingUp,
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

type MentorApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  expertise: string;
  certifications: string;
  powUrl?: string | null;
  status: string;
  mentorType?: string;
};

export default function ModeratorDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/mentor-application", { method: "GET" });
        const data = await res.json();
        if (data.success && data.applications) {
          setApplications(data.applications);
        } else {
          setError("Failed to load applications");
        }
      } catch (e) {
        setError((e as Error)?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.message("Signed out successfully", {
        description: "You have been signed out successfully.",
      });
      router.push("/");
    } catch (error) {
      toast.error("Error Signing Out", {
        description: "There is a problem in signing out",      });
    }
  };

  const SidebarMenuItems = [
    {
      id: "overview",
      title: "Overview",
      icon: BarChart3,
      description: "Dashboard overview & stats",
    },
    {
      id: "applications",
      title: "Mentor Applications",
      icon: FileText,
      description: "Review mentor applications",
    },
    {
      id: "users",
      title: "User Management",
      icon: Users,
      description: "Manage platform users",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: TrendingUp,
      description: "Platform insights",
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      description: "Moderator preferences",
    },
    {
      id: "support",
      title: "Help & Support",
      icon: HelpCircle,
      description: "Get help when needed",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "applications":
        return renderApplications();
      case "users":
        return renderUsers();
      case "analytics":
        return renderAnalytics();
      case "settings":
        return renderSettings();
      case "support":
        return renderSupport();
      default:
        return renderOverview();
    }
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id + status);
    setError(null);
    try {
      const res = await fetch(`/api/mentor-application`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json();
      if (result.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === id ? { ...app, status } : app
          )
        );
        toast.success(`Application ${status}`);
      } else {
        setError(result.error || `Failed to ${status}`);
        toast.error(result.error || `Failed to ${status}`);
      }
    } catch (e) {
      setError((e as Error)?.message || `Failed to ${status}`);
      toast.error((e as Error)?.message || `Failed to ${status}`);    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, Moderator!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage mentor applications, users, and platform oversight.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Applications</p>
              <p className="text-xl font-semibold">{applications.filter(app => app.status === 'pending' || !app.status).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved Mentors</p>
              <p className="text-xl font-semibold">{applications.filter(app => app.status === 'approved').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-xl font-semibold">{applications.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-xl font-semibold">8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent Applications
        </h2>
        <div className="space-y-3">
          {applications.slice(0, 3).map((app) => (
            <div key={app.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-gray-500">
                    {app.mentorType === 'YOGAMENTOR' ? 'Yoga Mentor' : 'Diet Planner'} • {app.email}
                  </p>
                </div>
              </div>
              <Badge className={`${
                app.status === 'approved' ? 'bg-green-500' :
                app.status === 'rejected' ? 'bg-red-500' :
                'bg-yellow-500'
              } text-white`}>
                {app.status || 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
        <Button 
          className="w-full mt-4 bg-[#76d2fa] hover:bg-[#5a9be9]"
          onClick={() => setActiveSection("applications")}
        >
          View All Applications
        </Button>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("applications")}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Review Applications</p>
              <p className="text-sm text-gray-500">Approve or reject mentors</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("users")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-gray-500">User administration</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/5 to-[#a792fb]/5 border border-[#876aff]/30"
          onClick={() => setActiveSection("analytics")}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-500">Platform insights</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
        <p className="text-gray-600 mt-2">
          Review and manage mentor applications for the platform.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <button className="pb-2 px-1 border-b-2 border-[#76d2fa] text-[#76d2fa] font-medium">
          All Applications
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Pending
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Approved
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76d2fa] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      ) : error ? (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      ) : applications.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No mentor applications found.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{app.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{app.name}</h3>
                      <Badge className={`${
                        app.mentorType === 'YOGAMENTOR' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {app.mentorType === 'YOGAMENTOR' ? 'Yoga Mentor' : 'Diet Planner'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {app.phone}
                      </div>
                      <div>
                        <span className="font-medium">Expertise:</span> {app.expertise}
                      </div>
                      <div>
                        <span className="font-medium">Certifications:</span> {app.certifications}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Experience:</span>
                      <p className="text-gray-600 mt-1">{app.experience}</p>
                    </div>
                    {app.powUrl && (
                      <div className="mt-3">
                        <a 
                          href={app.powUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-[#76d2fa] hover:text-[#5a9be9] text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Proof of Work
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Badge className={`${
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || "pending"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionLoading === app.id + "approved" || app.status === "approved"}
                      onClick={() => handleAction(app.id, "approved")}
                    >
                      {actionLoading === app.id + "approved" ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === app.id + "rejected" || app.status === "rejected"}
                      onClick={() => handleAction(app.id, "rejected")}
                    >
                      {actionLoading === app.id + "rejected" ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage platform users, roles, and permissions.
        </p>
      </div>
      <Card className="p-6">
        <ModeratorUserManagement />
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Platform insights and performance metrics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <h3 className="font-semibold mb-2">Application Rate</h3>
          <div className="text-2xl font-bold text-[#76d2fa]">89%</div>
          <p className="text-sm text-gray-500">Approval rate this month</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <h3 className="font-semibold mb-2">Average Response Time</h3>
          <div className="text-2xl font-bold text-[#ff7dac]">2.4 days</div>
          <p className="text-sm text-gray-500">For application reviews</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <h3 className="font-semibold mb-2">Active Mentors</h3>
          <div className="text-2xl font-bold text-[#876aff]">156</div>
          <p className="text-sm text-gray-500">Currently on platform</p>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure moderator preferences and notifications.</p>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Applications</p>
              <p className="text-sm text-gray-500">Get notified of new mentor applications</p>
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
        <p className="text-gray-600 mt-2">Get help with moderation tools and platform management.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">How to review applications?</p>
              <p className="text-sm text-gray-500">Learn the application review process</p>
            </button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Admin</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#76d2fa]" />
              <div>
                <p className="font-medium">Admin Support</p>
                <p className="text-sm text-gray-500">admin@yogvaidya.com</p>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[#876aff] to-[#a792fb] hover:from-[#a792fb] hover:to-[#876aff]">Contact Admin</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76d2fa] mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading moderator dashboard...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Sidebar */}
      <Sidebar className="w-64 bg-white shadow-lg border-r border-purple-100">
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Moderator</h2>
              <p className="text-xs text-gray-500">
                YogVaidya Platform
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>
              <span className="text-sm font-semibold text-gray-600 mb-2">
                Moderator Dashboard
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
