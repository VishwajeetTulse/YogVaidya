import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { getUserDetails, type UserDetails } from "@/lib/userDetails";
import { type BaseHookResult } from "./types";

export const useDashboard = (initialActiveSection = "overview"): BaseHookResult => {
  const router = useRouter();
  const { data: session } = useSession();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(initialActiveSection);

  const fetchUserDetails = useCallback(async () => {
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
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserDetails();
    }
  }, [fetchUserDetails, session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.message("Signed out successfully", {
        description: "You have been signed out successfully.",
      });
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error", {
        description: "Failed to sign out",
      });
    }
  };
  return {
    userDetails,
    loading,
    activeSection,
    setActiveSection,
    handleSignOut,
    fetchUserDetails,
  };
};
