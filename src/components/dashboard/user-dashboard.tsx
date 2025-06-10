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
  CreditCard,
  Shield,
  User,
  Mail,
  Phone,
  Home,
  Settings,
  BookOpen,
  Users,
  Heart,
  Activity,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Clock,
  Target,
  TrendingUp,
  Award,
  PlayCircle,
  MessageSquare,
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

export default function UserDashboard() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500 text-white";
      case "INACTIVE":
        return "bg-gray-500 text-white";
      case "CANCELLED":
        return "bg-red-500 text-white";
      case "EXPIRED":
        return "bg-orange-500 text-white";
      case "PENDING":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "SEED":
        return "bg-gray-500 text-white";
      case "BLOOM":
        return "bg-purple-500 text-white";
      case "FLOURISH":
        return "bg-pink-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const SidebarMenuItems = [
    {
      id: "overview",
      title: "Overview",
      icon: Home,
      description: "Dashboard overview",
    },
    {
      id: "classes",
      title: "My Classes",
      icon: PlayCircle,
      description: "Scheduled and past classes",
    },
    {
      id: "progress",
      title: "Progress",
      icon: TrendingUp,
      description: "Track your yoga journey",
    },
    {
      id: "mentors",
      title: "My Mentors",
      icon: Users,
      description: "Connect with your guides",
    },
    {
      id: "wellness",
      title: "Wellness Hub",
      icon: Heart,
      description: "Health and wellness tracking",
    },
    {
      id: "library",
      title: "Content Library",
      icon: BookOpen,
      description: "Videos, articles, and resources",
    },
    {
      id: "community",
      title: "Community",
      icon: MessageSquare,
      description: "Connect with fellow yogis",
    },
    {
      id: "subscription",
      title: "Subscription",
      icon: CreditCard,
      description: "Manage your plan",
    },
    {
      id: "profile",
      title: "Profile",
      icon: User,
      description: "Personal information",
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
      description: "Get help when you need it",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "classes":
        return renderClasses();
      case "progress":
        return renderProgress();
      case "mentors":
        return renderMentors();
      case "wellness":
        return renderWellness();
      case "library":
        return renderLibrary();
      case "community":
        return renderCommunity();
      case "subscription":
        return renderSubscription();
      case "profile":
        return renderProfile();
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
          Welcome back, {userDetails?.name || "Yogi"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your wellness journey with personalized yoga sessions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes This Week</p>
              <p className="text-xl font-semibold">5</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Practice</p>
              <p className="text-xl font-semibold">24h 30m</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Goals Achieved</p>
              <p className="text-xl font-semibold">12/15</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Streak</p>
              <p className="text-xl font-semibold">7 days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Schedule
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Morning Hatha Yoga</p>
                <p className="text-sm text-gray-500">
                  with Mentor Sarah • 7:00 AM
                </p>
              </div>
            </div>
            <Button size="sm">Join</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Meditation Session</p>
                <p className="text-sm text-gray-500">
                  with Mentor Raj • 6:00 PM
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Reschedule
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection("classes")}
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium">Start Practice</p>
              <p className="text-sm text-gray-500">Begin your session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection("mentors")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium">Book Session</p>
              <p className="text-sm text-gray-500">Schedule with mentor</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection("progress")}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-medium">View Progress</p>
              <p className="text-sm text-gray-500">Track your journey</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-2">
          Manage your scheduled and completed yoga sessions.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <button className="pb-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
          Upcoming
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Completed
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Cancelled
        </button>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Vinyasa Flow - Level 2
                  </h3>
                  <p className="text-gray-500">with Mentor Sarah Johnson</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tomorrow, 7:00 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      60 minutes
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Reschedule</Button>
                <Button>Join Class</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="text-gray-600 mt-2">
          Track your yoga journey and celebrate your achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            This Month's Achievements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Classes Completed</span>
              <span className="font-semibold">12/15</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: "80%" }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span>Meditation Minutes</span>
              <span className="font-semibold">420/500</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "84%" }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Streak & Badges</h3>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-bold">7 Days</p>
            <p className="text-gray-500">Current Streak</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6].map((badge) => (
              <div
                key={badge}
                className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderMentors = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Mentors</h1>
        <p className="text-gray-600 mt-2">
          Connect with your personal yoga guides and book sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((mentor) => (
          <Card key={mentor} className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg">Sarah Johnson</h3>
              <p className="text-gray-500 text-sm">
                Hatha & Vinyasa Specialist
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">(4.9)</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  Message
                </Button>
                <Button size="sm" className="flex-1">
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWellness = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wellness Hub</h1>
        <p className="text-gray-600 mt-2">
          Monitor your physical and mental wellness journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Health Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Flexibility Score</span>
              <span className="font-semibold">7.2/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Stress Level</span>
              <span className="font-semibold text-green-600">Low</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sleep Quality</span>
              <span className="font-semibold">8.5/10</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Mindfulness
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">15</div>
              <div className="text-sm text-gray-500">minutes today</div>
            </div>
            <Button className="w-full">Start Meditation</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
        <p className="text-gray-600 mt-2">
          Explore our collection of yoga videos, articles, and resources.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <button className="pb-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
          Videos
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Articles
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Courses
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Favorites
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((video) => (
          <Card key={video} className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <PlayCircle className="w-12 h-12 text-white" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">Morning Sun Salutation</h3>
              <p className="text-sm text-gray-500 mt-1">
                15 minutes • Beginner
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.8</span>
                </div>
                <Button size="sm">Watch</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-600 mt-2">
          Connect with fellow yogis and share your journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((post) => (
                <div key={post} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Alex Johnson</span>
                        <span className="text-sm text-gray-500">2h ago</span>
                      </div>
                      <p className="text-gray-700 mt-1">
                        Just completed my first advanced vinyasa class! Feeling
                        amazing 🧘‍♀️
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <button className="hover:text-blue-600">❤️ 12</button>
                        <button className="hover:text-blue-600">💬 3</button>
                        <button className="hover:text-blue-600">Share</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Groups</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Beginner's Circle</p>
                  <p className="text-xs text-gray-500">245 members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Meditation Masters</p>
                  <p className="text-xs text-gray-500">189 members</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription plan and billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Current Plan</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <div className="flex items-center gap-2">
                <Badge
                  className={getPlanColor(userDetails?.subscriptionPlan || "")}
                >
                  {userDetails?.subscriptionPlan || "SEED"}
                </Badge>
                {userDetails?.isTrialActive && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                  >
                    Trial
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <Badge
                className={getStatusColor(
                  userDetails?.subscriptionStatus || ""
                )}
              >
                {userDetails?.subscriptionStatus || "INACTIVE"}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Billing Period
              </label>
              <p className="text-gray-900">
                {userDetails?.billingPeriod || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Payment Amount
              </label>
              <p className="text-gray-900 font-semibold">
                ₹{userDetails?.paymentAmount || 0}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="flex-1">
              Change Plan
            </Button>
            <Button className="flex-1">Upgrade</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Billing History</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((bill) => (
              <div
                key={bill}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div>
                  <p className="font-medium">₹999</p>
                  <p className="text-sm text-gray-500">March 2024</p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  Paid
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-indigo-600" />
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
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <Badge className="bg-indigo-100 text-indigo-800">
                  {userDetails?.role}
                </Badge>
              </div>
            </div>
          </div>
          <Button className="w-full mt-6">Edit Profile</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Account Activity</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Member Since
              </label>
              <p className="text-gray-900">
                {formatDate(userDetails?.createdAt)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <p className="text-gray-900">
                {formatDate(userDetails?.updatedAt)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Active Sessions
              </label>
              <p className="text-gray-900">{userDetails?.sessionsCount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Linked Accounts
              </label>
              <p className="text-gray-900">{userDetails?.accountsCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your app experience and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Class Reminders</p>
                <p className="text-sm text-gray-500">
                  Get notified before your scheduled classes
                </p>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Progress Updates</p>
                <p className="text-sm text-gray-500">
                  Weekly progress and achievement notifications
                </p>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-gray-500">
                  Allow other users to see your profile
                </p>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Progress Sharing</p>
                <p className="text-sm text-gray-500">
                  Share progress with community
                </p>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get help with your yoga journey and technical issues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">How to book a class?</p>
              <p className="text-sm text-gray-500">
                Learn how to schedule sessions with mentors
              </p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">Technical issues</p>
              <p className="text-sm text-gray-500">
                Troubleshoot common app problems
              </p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
              <p className="font-medium">Billing questions</p>
              <p className="text-sm text-gray-500">
                Get help with subscription and payments
              </p>
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-500">support@yogavaidya.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>
            </div>
            <Button className="w-full mt-4">Start Chat</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading user details...</span>
        </div>
      </div>
    );
  }
  return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="w-64 bg-white shadow-lg">
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{userDetails?.name?.substring(0,2) || "YV"}</span>
              </div>
              <div>
                <h2 className="font-semibold">{userDetails?.name || "Welcome"}</h2>
                <p className="text-xs text-gray-500">
                  YogaVaidya
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel>
                <span className="text-sm font-semibold text-gray-600 mb-2">
                  Dashboard
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
