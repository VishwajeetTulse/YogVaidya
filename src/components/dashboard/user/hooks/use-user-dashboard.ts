import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { getUserDetails, UserDetails } from "@/lib/userDetails";
import { cancelUserSubscription } from "@/lib/subscriptions";

export const useUserDashboard = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [viewMode, setViewMode] = useState<"cards" | "comparison">("cards");

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
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  return {
    userDetails,
    loading,
    activeSection,
    setActiveSection,
    cancellingSubscription,
    billingPeriod,
    setBillingPeriod,
    viewMode,
    setViewMode,
    handleSignOut,
    handleCancelSubscription,
  };
};
