"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";

export default function UserDashboard() {
  const router = useRouter();

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
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the user dashboard!</p>
      <Button onClick={handleSignOut}>Log Out</Button>
    </div>
  );
}
