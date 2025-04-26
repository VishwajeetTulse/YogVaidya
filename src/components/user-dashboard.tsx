"use client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export default function UserDashboard() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
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
    } finally {
      setIsSigningOut(false);
    }
  };
  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome to the user dashboard!</p>
      <Button onClick={handleSignOut}>Log Out</Button>
    </div>
  );
}
