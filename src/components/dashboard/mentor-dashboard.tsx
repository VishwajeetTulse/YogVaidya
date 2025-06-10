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
  Calendar,
  Users,
  DollarSign,
  Star,
  Clock,
  BookOpen,
  MessageSquare,
  Video,
  TrendingUp,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  PlayCircle,
  User,
  Mail,
  Phone,
  Shield,
  Activity,
  FileText,
  BarChart3,
  Timer,
  Target,
  Heart,
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

export default function MentorDashboard() {
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
      console.log("Sign out error", error);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const SidebarMenuItems = [
    {
      id: "overview",
      title: "Overview",
      icon: BarChart3,
      description: "Dashboard overview & stats",
    },
    {
      id: "sessions",
      title: "My Sessions",
      icon: Video,
      description: "Scheduled and past sessions",
    },
    {
      id: "students",
      title: "My Students",
      icon: Users,
      description: "Manage your students",
    },
    {
      id: "schedule",
      title: "Schedule",
      icon: Calendar,
      description: "Manage your availability",
    },    {
      id: "earnings",
      title: "Earnings",
      icon: DollarSign,
      description: "Track your income",
    },
    {
      id: "reviews",
      title: "Reviews & Ratings",
      icon: Star,
      description: "Student feedback",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: TrendingUp,
      description: "Performance insights",
    },
    {
      id: "messages",
      title: "Messages",
      icon: MessageSquare,
      description: "Chat with students",
    },
    {
      id: "profile",
      title: "Profile",
      icon: User,
      description: "Mentor information",
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      description: "App preferences",
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
      case "sessions":
        return renderSessions();
      case "students":
        return renderStudents();
      case "schedule":
        return renderSchedule();      case "earnings":
        return renderEarnings();
      case "reviews":
        return renderReviews();
      case "analytics":
        return renderAnalytics();
      case "messages":
        return renderMessages();
      case "profile":
        return renderProfile();
      case "settings":
        return renderSettings();
      case "support":
        return renderSupport();
      default:
        return renderOverview();
    }
  };  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Mentor"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your teaching dashboard. Ready to inspire and guide your students.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-xl font-semibold">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions This Week</p>
              <p className="text-xl font-semibold">12</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-xl font-semibold">₹15,420</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-xl font-semibold">4.8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Sessions
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
              <div>
                <p className="font-medium">Hatha Yoga for Beginners</p>
                <p className="text-sm text-gray-500">
                  with Alice Johnson • 9:00 AM - 10:00 AM
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-[#76d2fa] hover:bg-[#5a9be9]">Start</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFCCEA]/20 to-[#ffa6c5]/10 rounded-lg border border-[#FFCCEA]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#ff7dac] rounded-full"></div>
              <div>
                <p className="font-medium">Advanced Vinyasa Flow</p>
                <p className="text-sm text-gray-500">
                  with Mark Smith • 6:00 PM - 7:30 PM
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-[#ff7dac] text-[#ff7dac] hover:bg-[#ff7dac] hover:text-white">
              View Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("sessions")}
        >
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Create Session</p>
              <p className="text-sm text-gray-500">Schedule new class</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("students")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">View Students</p>
              <p className="text-sm text-gray-500">Manage your students</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/5 to-[#a792fb]/5 border border-[#876aff]/30"
          onClick={() => setActiveSection("earnings")}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-500">Track performance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-600 mt-2">
          Manage your upcoming and completed yoga sessions.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <button className="pb-2 px-1 border-b-2 border-[#76d2fa] text-[#76d2fa] font-medium">
          Upcoming
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Completed
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Cancelled
        </button>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Hatha Yoga for Beginners
                  </h3>
                  <p className="text-gray-500">with Alice Johnson</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tomorrow, 9:00 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      60 minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      1 student
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">Edit</Button>
                <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">Start Session</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-2">
          Connect with and track your students' progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((student) => (
          <Card key={student} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-semibold">AJ</span>
              </div>
              <h3 className="font-semibold text-lg">Alice Johnson</h3>
              <p className="text-gray-500 text-sm">
                Member since Jan 2024
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                <span className="text-[#76d2fa]">12 Sessions</span>
                <span className="text-[#ff7dac]">Level: Beginner</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  Message
                </Button>
                <Button size="sm" className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]">
                  View Progress
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-2">
          Manage your availability and upcoming sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#76d2fa]" />
            This Week's Schedule
          </h3>
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
              <div key={day} className="flex justify-between items-center p-2 rounded">
                <span className="font-medium">{day}</span>
                <span className="text-sm text-gray-500">9:00 AM - 5:00 PM</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff7dac]" />
            Available Slots
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="text-sm">Today 2:00 PM</span>
              <Badge className="bg-green-500 text-white">Available</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span className="text-sm">Today 4:00 PM</span>
              <Badge className="bg-[#76d2fa] text-white">Booked</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="text-sm">Tomorrow 9:00 AM</span>
              <Badge className="bg-green-500 text-white">Available</Badge>
            </div>
          </div>
          <Button className="w-full mt-4 bg-gradient-to-r from-[#ff7dac] to-[#ffa6c5] hover:from-[#ffa6c5] hover:to-[#ff7dac]">
            Update Availability
          </Button>
        </Card>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-2">
          Track your income and payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <h3 className="text-sm text-gray-500">This Month</h3>
          <p className="text-2xl font-bold text-[#76d2fa]">₹15,420</p>
          <p className="text-sm text-green-600">+12% from last month</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <h3 className="text-sm text-gray-500">Total Earned</h3>
          <p className="text-2xl font-bold text-[#ff7dac]">₹1,24,300</p>
          <p className="text-sm text-gray-500">Since Jan 2024</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <h3 className="text-sm text-gray-500">Pending Payment</h3>
          <p className="text-2xl font-bold text-[#876aff]">₹2,340</p>
          <p className="text-sm text-yellow-600">To be paid on 15th</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((payment) => (
            <div key={payment} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Session Payment</p>
                <p className="text-sm text-gray-500">March 10, 2024 • Alice Johnson</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+₹800</p>
                <Badge variant="outline" className="text-green-600">Paid</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your mentor profile and professional information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-[#76d2fa]" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{userDetails?.name || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {userDetails?.email}
                {userDetails?.emailVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {userDetails?.phone || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Specialty</label>
              <Badge className="bg-gradient-to-r from-[#876aff] to-[#a792fb] text-white">
                Hatha & Vinyasa Yoga
              </Badge>
            </div>
          </div>
          <Button className="w-full mt-6 bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] hover:from-[#5a9be9] hover:to-[#76d2fa]">Edit Profile</Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-[#ff7dac]" />
            <h2 className="text-xl font-semibold">Professional Stats</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Experience
              </label>
              <p className="text-gray-900">5+ Years</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Students
              </label>
              <p className="text-gray-900">156</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Sessions Completed
              </label>
              <p className="text-gray-900">1,234</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Average Rating
              </label>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-[#876aff] text-[#876aff]" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(4.8/5)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // Additional render functions for other sections
  const renderReviews = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
        <p className="text-gray-600 mt-2">See what your students say about your sessions.</p>
      </div>
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-[#876aff]">4.8</div>
          <div className="flex justify-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 fill-[#876aff] text-[#876aff]" />
            ))}
          </div>
          <p className="text-gray-500">Based on 89 reviews</p>
        </div>
        {/* Add review items here */}
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Performance insights and growth metrics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <h3 className="font-semibold mb-2">Session Completion Rate</h3>
          <div className="text-2xl font-bold text-[#76d2fa]">94%</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <h3 className="font-semibold mb-2">Student Retention</h3>
          <div className="text-2xl font-bold text-[#ff7dac]">87%</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <h3 className="font-semibold mb-2">Avg Session Duration</h3>
          <div className="text-2xl font-bold text-[#876aff]">58 min</div>
        </Card>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Chat with your students and manage conversations.</p>
      </div>
      <Card className="p-6">
        <p className="text-center text-gray-500">Message interface would be implemented here</p>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your preferences and notifications.</p>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Student Bookings</p>
              <p className="text-sm text-gray-500">Get notified when students book sessions</p>
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
        <p className="text-gray-600 mt-2">Get help with your mentor journey and technical issues.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">How to create sessions?</p>
              <p className="text-sm text-gray-500">Learn to schedule and manage classes</p>
            </button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#76d2fa]" />
              <div>
                <p className="font-medium">Mentor Support</p>
                <p className="text-sm text-gray-500">mentors@yogavaidya.com</p>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[#876aff] to-[#a792fb] hover:from-[#a792fb] hover:to-[#876aff]">Contact Support</Button>
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
          <span className="ml-3 text-gray-600">Loading mentor details...</span>
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
              <span className="text-white font-bold text-sm">{userDetails?.name?.substring(0,2) || "YM"}</span>
            </div>
            <div>
              <h2 className="font-semibold">{userDetails?.name || "Yoga Mentor"}</h2>
              <p className="text-xs text-gray-500">
                YogaVaidya Mentor
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>
              <span className="text-sm font-semibold text-gray-600 mb-2">
                Mentor Dashboard
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
