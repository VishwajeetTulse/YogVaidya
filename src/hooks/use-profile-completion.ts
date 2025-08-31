import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UseProfileCompletionProps {
  redirectTo?: string;
  autoRedirect?: boolean;
}

interface ProfileCompletionState {
  isLoading: boolean;
  hasPhone: boolean | null;
  needsCompletion: boolean;
  redirectToCompletion: () => void;
}

export function useProfileCompletion({ 
  redirectTo = "/dashboard", 
  autoRedirect = false 
}: UseProfileCompletionProps = {}): ProfileCompletionState {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);

  const redirectToCompletion = () => {
    router.push(`/complete-profile?redirectTo=${encodeURIComponent(redirectTo)}`);
  };

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setIsLoading(false);
      setHasPhone(null);
      return;
    }

    const checkProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        const result = await response.json();

        if (result.success) {
          const userHasPhone = !!result.user?.phone;
          setHasPhone(userHasPhone);

          if (!userHasPhone && autoRedirect) {
            redirectToCompletion();
          }
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
        setHasPhone(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [session, isPending, autoRedirect, redirectTo, router]);

  return {
    isLoading,
    hasPhone,
    needsCompletion: hasPhone === false,
    redirectToCompletion,
  };
}
