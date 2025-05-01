"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import React, { useEffect, useState } from "react";
import ModeratorUserManagement from "@/components/dashboard/moderator-user-management";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError,] = useState<string | null>(null);

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
      } catch (e: any) {
        setError(e.message || "Failed to load applications");
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
        description: "There is a problem in signing out",
      });
      console.log("Sign out error", error);
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
    } catch (e: any) {
      setError(e.message || `Failed to ${status}`);
      toast.error(e.message || `Failed to ${status}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the mod dashboard!</p>
      <Button onClick={handleSignOut}>Log Out</Button>
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Mentor Applications</h2>
        {loading ? (
          <div>Loading applications...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : applications.length === 0 ? (
          <div>No mentor applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Experience</th>
                  <th className="p-2 border">Expertise</th>
                  <th className="p-2 border">Certifications</th>
                  <th className="p-2 border">POW URL</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="p-2 border">{app.name}</td>
                    <td className="p-2 border">{app.email}</td>
                    <td className="p-2 border">{app.phone}</td>
                    <td className="p-2 border">{app.experience}</td>
                    <td className="p-2 border">{app.expertise}</td>
                    <td className="p-2 border">{app.certifications}</td>
                    <td className="p-2 border">
                      {app.proofOfWorkUrl ? (
                        <a href={app.proofOfWorkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">POW Link</a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-2 border">{app.status || "pending"}</td>
                    <td className="p-2 border flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-10">
        <ModeratorUserManagement />
      </div>
    </div>
  );
}
