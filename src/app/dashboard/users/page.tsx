"use client";
import { Button } from "@/components/ui/button";
import { authClient, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function UsersPage() {
  const session = authClient.useSession();
  const router = useRouter();
  if (!session.data) {
    router.push("/signin");
  }
  console.log(session);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.message("Signed out successfully", {
        description: "You have been signed out successfully.",
      });
      router.push("/");
    } catch (error) {
      toast.error("Error signing out", {
        description: "there is a problem signing out",
      });
    } finally {
      setIsSigningOut(false);
    }
    
  };
  return (
    <div>
      <Button onClick={handleSignOut}>Log Out</Button>
    </div>
  );
}
