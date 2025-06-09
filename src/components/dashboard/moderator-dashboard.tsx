"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import React, { useEffect, useState } from "react";
import ModeratorUserManagement from "@/components/dashboard/moderator-user-management";

type MentorApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  expertise: string;
  certifications: string;
  powUrl?: string | null;
  status: string;
  mentorType?: string;
};

export default function ModeratorDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      } catch (e) {
        setError((e as Error)?.message || "Failed to load applications");
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
    } catch (e) {
      setError((e as Error)?.message || `Failed to ${status}`);
      toast.error((e as Error)?.message || `Failed to ${status}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Moderator Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage mentor applications and user accounts</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Log Out
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Mentor Applications</h2>
            <div className="text-sm text-gray-500">
              Total: {applications.length} applications
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading applications...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No mentor applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Name</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Email</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Type</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Experience</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Expertise</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Certifications</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Proof of Work</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Status</th>
                    <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-300">{app.name}</td>
                      <td className="p-3 border border-gray-300">{app.email}</td>
                      <td className="p-3 border border-gray-300">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.mentorType === 'YOGAMENTOR' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {app.mentorType === 'YOGAMENTOR' ? 'Yoga Mentor' : 'Diet Planner'}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-300">
                        <div className="max-w-xs">
                          <p className="truncate" title={app.experience}>
                            {app.experience}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 border border-gray-300">{app.expertise}</td>
                      <td className="p-3 border border-gray-300">{app.certifications}</td>
                      <td className="p-3 border border-gray-300">
                        {app.powUrl ? (
                          <div className="flex flex-col gap-1">
                            <a 
                              href={app.powUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
                            >
                              📄 View Document
                            </a>
                            <span className="text-xs text-gray-500 truncate max-w-[120px]" title={app.powUrl}>
                              {app.powUrl.split('/').pop()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No document</span>
                        )}
                      </td>
                      <td className="p-3 border border-gray-300">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status || "pending"}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-300">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <ModeratorUserManagement />
        </div>
      </div>
    </div>
  );
}
