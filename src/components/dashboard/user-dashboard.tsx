"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { getUserDetails, UserDetails } from "@/lib/userDetails";
import { cancelUserSubscription } from "@/lib/subscriptions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Check,
  Crown,
  IndianRupee as IndianRupeeIcon,
  Sparkles
} from "lucide-react";
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
  const { data: session } = useSession();  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [upgradingSubscription, setUpgradingSubscription] = useState(false);

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
  };  const handleSignOut = async () => {
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
  const handleCancelSubscription = async () => {
    if (!session?.user?.id) {
      toast.error("Error", {
        description: "User session not found",
      });
      return;
    }

    const confirmMessage = "Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.";
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCancellingSubscription(true);
    try {
      const result = await cancelUserSubscription(session.user.id);
      
      if (result.success) {
        toast.success("Subscription Cancelled", {
          description: "Your subscription will be cancelled at the end of your billing period.",
        });
        // Refresh user details to show updated subscription status
        fetchUserDetails();
      } else {
        toast.error("Cancellation Failed", {
          description: result.error || "Failed to cancel subscription",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Error", {
        description: "An unexpected error occurred while cancelling subscription",
      });    } finally {
      setCancellingSubscription(false);
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
        return "bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] text-white";
      case "INACTIVE":
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case "CANCELLED":
        return "bg-gradient-to-r from-red-400 to-red-500 text-white";
      case "EXPIRED":
        return "bg-gradient-to-r from-orange-400 to-orange-500 text-white";
      case "PENDING":
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    }
  };
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "SEED":
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case "BLOOM":
        return "bg-gradient-to-r from-[#876aff] to-[#a792fb] text-white";
      case "FLOURISH":
        return "bg-gradient-to-r from-[#ffa6c5] to-[#ff7dac] text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
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
      id: "mentors",
      title: "My Mentors",
      icon: Users,
      description: "Connect with your guides",
    },
    {
      id: "library",
      title: "Content Library",
      icon: BookOpen,
      description: "Videos, articles, and resources",
    },    {
      id: "subscription",
      title: "Subscription",
      icon: CreditCard,
      description: "Manage your plan",
    },
    {
      id: "plans",
      title: "Upgrade Plans",
      icon: Target,
      description: "Explore premium plans",
    },
    {
      id: "explore-mentors",
      title: "Explore Mentors",
      icon: Users,
      description: "Find more mentors",
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
        return renderClasses();      case "mentors":
        return renderMentors();
      case "explore-mentors":
        return renderExploreMentors();
      case "library":
        return renderLibrary();
      case "subscription":
        return renderSubscription();
      case "plans":
        return renderPlans();
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
      </div>      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes This Week</p>
              <p className="text-xl font-semibold">5</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Practice</p>
              <p className="text-xl font-semibold">24h 30m</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Goals Achieved</p>
              <p className="text-xl font-semibold">12/15</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <Award className="w-5 h-5 text-white" />
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
        </h2>        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
              <div>
                <p className="font-medium">Morning Hatha Yoga</p>
                <p className="text-sm text-gray-500">
                  with Mentor Sarah • 7:00 AM
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-[#76d2fa] hover:bg-[#5a9be9]">Join</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFCCEA]/20 to-[#ffa6c5]/10 rounded-lg border border-[#FFCCEA]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#ff7dac] rounded-full"></div>
              <div>
                <p className="font-medium">Meditation Session</p>
                <p className="text-sm text-gray-500">
                  with Mentor Raj • 6:00 PM
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-[#ff7dac] text-[#ff7dac] hover:bg-[#ff7dac] hover:text-white">
              Reschedule
            </Button>
          </div>
        </div>
      </Card>      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("classes")}
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Start Practice</p>
              <p className="text-sm text-gray-500">Begin your session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("mentors")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">Book Session</p>
              <p className="text-sm text-gray-500">Schedule with mentor</p>
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
      </div>      <div className="flex gap-4 border-b">
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
            <div className="flex items-center justify-between">              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
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
              </div>              <div className="flex gap-2">
                <Button variant="outline" className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">Reschedule</Button>
                <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">Join Class</Button>
              </div>
            </div>
          </Card>
        ))}
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
          <Card key={mentor} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg">Sarah Johnson</h3>
              <p className="text-gray-500 text-sm">
                Hatha & Vinyasa Specialist
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#876aff] text-[#876aff]"
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">(4.9)</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  Message
                </Button>
                <Button size="sm" className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]">
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recommended Mentors</h2>
          <Button
            variant="outline"
            className="text-[#876aff] border-[#876aff]"
            onClick={() => setActiveSection("explore-mentors")}
          >
            View All Mentors
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((mentor) => (
            <Card key={mentor} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors bg-gradient-to-br from-purple-50/50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ff7dac] to-[#ffa6c5] rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-lg">Recommended Mentor {mentor}</h3>
                <p className="text-gray-500 text-sm">
                  {mentor === 1 ? "Meditation Expert" : mentor === 2 ? "Power Yoga Specialist" : "Prenatal Yoga Expert"}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-[#ff7dac] text-[#ff7dac]"
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">(5.0)</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-[#ff7dac] to-[#ffa6c5]">
                    Book Trial
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExploreMentors = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="text-gray-600 mt-2">
          Discover more yoga mentors and expand your practice with different styles and approaches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((mentor) => (
          <Card key={mentor} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg">New Mentor {mentor}</h3>
              <p className="text-gray-500 text-sm">
                Specializes in {mentor % 2 === 0 ? "Vinyasa & Power Yoga" : "Meditation & Yin Yoga"}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#876aff] text-[#876aff]"
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">(5.0)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">200+ sessions conducted</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  View Profile
                </Button>
                <Button size="sm" className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]">
                  Book Trial
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPlans = () => {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

    // Apply discount for annual billing
    const applyDiscount = (price: number) => {
      if (billingPeriod === "annual") {
        return Math.round(price * 0.8); // 20% discount for annual billing
      }
      return price;
    };

    const plans = [
      {
        id: "seed",
        name: "Seed",
        price: 1999,
        description: "Perfect for meditation enthusiasts",
        gradient: "from-[#76d2fa] to-[#5a9be9]",
        textColor: "text-[#5a9be9]",
        icon: <Crown className="w-7 h-7 text-white" />,
        features: [
          "Live meditation sessions",
          "Basic meditation guides",
          "Online support"
        ],
        isPopular: false
      },
      {
        id: "bloom",
        name: "Bloom",
        price: 1999,
        description: "Perfect for yoga enthusiasts",
        gradient: "from-[#CDC1FF] to-[#876aff]",
        textColor: "text-[#876aff]",
        icon: <Crown className="w-7 h-7 text-white" />,
        features: [
          "Live yoga sessions",
          "Pose guidance and corrections",
          "Online Support"
        ],
        isPopular: true
      },
      {
        id: "flourish",
        name: "Flourish",
        price: 4999,
        description: "Complete wellness journey",
        gradient: "from-[#ffa6c5] to-[#ff7dac]",
        textColor: "text-[#ff7dac]",
        icon: <Sparkles className="w-7 h-7 text-white" />,
        features: [
          "Live meditation sessions",
          "Live yoga sessions", 
          "Personalized diet plan"
        ],
        isPopular: false
      }
    ];

    return (
      <section className="py-12 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white -z-10"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl"></div>

        <div className="space-y-6">
          {/* Heading */}
          <div className="text-center mb-12 relative">
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
              Your Plans
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Choose the perfect plan
              <br />
              for your wellness journey
            </h2>

            {/* Billing period toggle */}
            <div className="inline-flex items-center bg-gray-200 p-1 rounded-full">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "bg-[#76d2fa] text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "annual"
                    ? "bg-[#76d2fa] text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                ANNUAL
              </button>
            </div>

            {billingPeriod === "annual" && (
              <div className="mt-4 text-green-600 font-medium animate-pulse">
                Save 20% with annual billing
              </div>
            )}
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-gradient-to-b ${plan.gradient} rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] h-full ${
                  plan.isPopular ? "transform md:scale-105 relative z-10" : ""
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -right-12 top-6 bg-white text-[#876aff] text-xs font-bold px-12 py-1 transform rotate-45">
                    POPULAR
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Plan header */}
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        {plan.icon}
                      </div>
                      <span className="text-xs font-semibold bg-white/20 text-white px-4 py-1 rounded-full uppercase">
                        {plan.name}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end">
                      <span className="text-5xl font-bold text-white flex items-center">
                        <IndianRupeeIcon className="w-8 h-8" />
                        <span className="text-5xl font-bold text-white">
                          {applyDiscount(plan.price)}
                        </span>
                      </span>
                      <span className="text-white/70 ml-2 mb-1">
                        / {billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    <p className="text-white mt-2">{plan.description}</p>
                  </div>                  {/* Features */}
                  <div className="space-y-4 mt-4 mb-8 flex-grow">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <Link href={`/checkout?plan=${plan.id}`} passHref>
                    <Button
                      className={`mt-auto w-full py-6 rounded-xl bg-white ${plan.textColor} hover:bg-white/90 transition-all duration-300 font-medium`}
                    >
                      UPGRADE NOW
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Additional info */}
          <div className="text-center mt-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Why choose Yoga Vaidya?
            </h3>
            <p className="text-gray-600">
              All plans include access to our mobile app, progress tracking, and
              community support. Not sure which plan is right for you? Try our
              7-day free trial on any plan.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                No credit card required
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                Cancel anytime
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                Secure payments
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/20">
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
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />                <Badge className="bg-gradient-to-r from-[#876aff] to-[#a792fb] text-white">
                  {userDetails?.role}
                </Badge>
              </div>
            </div>
          </div>
          <Button className="w-full mt-6 bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] hover:from-[#5a9be9] hover:to-[#76d2fa]">Edit Profile</Button>
        </Card>        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-[#ff7dac]" />
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
          <div className="space-y-4">            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Class Reminders</p>
                <p className="text-sm text-gray-500">
                  Get notified before your scheduled classes
                </p>
              </div>
              <div className="w-12 h-6 bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] rounded-full relative">
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
          <div className="space-y-4">            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-gray-500">
                  Allow other users to see your profile
                </p>
              </div>
              <div className="w-12 h-6 bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] rounded-full relative">
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
          <div className="space-y-4">            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#76d2fa]" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-500">support@yogavaidya.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#ff7dac]" />
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-[#876aff] to-[#a792fb] hover:from-[#a792fb] hover:to-[#876aff]">Start Chat</Button>
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
          Access our collection of yoga and meditation resources.
        </p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Yoga Tutorials</h3>
              <p className="text-sm text-gray-500">Step-by-step pose guides and sequences</p>
            </div>
            <div className="space-y-3 flex-grow">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <PlayCircle className="w-8 h-8 text-[#76d2fa]" />
                  <div>
                    <p className="font-medium">Basic Yoga Flow {item}</p>
                    <p className="text-sm text-gray-500">15 minutes • Beginner</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full bg-[#76d2fa] hover:bg-[#5a9be9]">
              View All Tutorials
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/10 border border-[#FFCCEA]/20">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Meditation Sessions</h3>
              <p className="text-sm text-gray-500">Guided meditation and mindfulness</p>
            </div>
            <div className="space-y-3 flex-grow">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <PlayCircle className="w-8 h-8 text-[#ff7dac]" />
                  <div>
                    <p className="font-medium">Mindful Meditation {item}</p>
                    <p className="text-sm text-gray-500">10 minutes • All levels</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full bg-gradient-to-r from-[#ffa6c5] to-[#ff7dac]">
              View All Sessions
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Wellness Articles</h3>
              <p className="text-sm text-gray-500">Expert insights and tips</p>
            </div>
            <div className="space-y-3 flex-grow">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <BookOpen className="w-8 h-8 text-[#876aff]" />
                  <div>
                    <p className="font-medium">Yoga Benefits {item}</p>
                    <p className="text-sm text-gray-500">5 min read</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full bg-gradient-to-r from-[#876aff] to-[#a792fb]">
              View All Articles
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Current Plan</h2>
              <p className="text-sm text-gray-500">Your active subscription</p>
            </div>
          </div>
          <Badge
            className={`${getStatusColor(userDetails?.subscriptionStatus || "INACTIVE")}`}
          >
            {userDetails?.subscriptionStatus || "INACTIVE"}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <p className="text-lg font-semibold">{userDetails?.subscriptionPlan || "Free Plan"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Billing Period</label>
              <p className="text-lg font-semibold">
                {userDetails?.billingPeriod || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Next Billing</label>
              <p className="text-lg font-semibold">
                {formatDate(userDetails?.nextBillingDate) || "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-semibold flex items-center">
                <IndianRupeeIcon className="w-4 h-4 mr-1" />
                {userDetails?.paymentAmount || "0"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-lg font-semibold">
                {formatDate(userDetails?.subscriptionStartDate) || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Date</label>
              <p className="text-lg font-semibold">
                {formatDate(userDetails?.subscriptionEndDate) || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          {userDetails?.subscriptionStatus === "ACTIVE" ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
              >
                {cancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
              </Button>
              <Button 
                className="flex-1 bg-[#876aff] hover:bg-[#7b5cff]"
                onClick={() => setActiveSection("plans")}
              >
                Change Plan
              </Button>
            </>
          ) : (
            <Button 
              className="w-full bg-[#876aff] hover:bg-[#7b5cff]"
              onClick={() => setActiveSection("plans")}
            >
              Upgrade Now
            </Button>
          )}
        </div>
      </Card>

      {/* Payment History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div 
              key={item}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#876aff]/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-[#876aff]" />
                </div>
                <div>
                  <p className="font-medium">Payment #{item}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(2025, 5, 12 - item).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium flex items-center">
                  <IndianRupeeIcon className="w-4 h-4 mr-1" />1,999
                </p>
                <Badge variant="secondary">Successful</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76d2fa] mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading user details...</span>
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
