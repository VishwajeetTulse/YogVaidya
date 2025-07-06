"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Check, X, Eye, FileText } from "lucide-react";
import { 
  getMentorApplicationsAction, 
  updateMentorApplicationStatusAction 
} from "@/lib/actions/mentor-application-actions";

interface MentorApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string | null;
  experience: string;
  expertise: string;
  certifications: string;
  powUrl?: string | null;
  status: string | null;
  mentorType?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
}

export const ApplicationsSection = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const result = await getMentorApplicationsAction();
      
      if (result.success && result.applications) {
        setApplications(result.applications);
      } else {
        toast.error("Failed to load applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("An error occurred while fetching applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const result = await updateMentorApplicationStatusAction(id, status);
      
      if (result.success) {
        toast.success(`Application ${status}`);
        // Update the local state
        setApplications(applications.map(app => 
          app.id === id ? { ...app, status } : app
        ));
        setSelectedApplication(null);
      } else {
        toast.error("Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("An error occurred while updating application status");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
        <p className="text-gray-600 mt-2">
          Review and approve mentor applications.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-lg font-semibold text-gray-700">No Applications</p>
          <p className="text-gray-500">There are no mentor applications to review at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="font-semibold text-lg">All Applications</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {applications.map((app) => (
                <Card 
                  key={app.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedApplication?.id === app.id ? "border-2 border-blue-500" : ""
                  }`}
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Applied: {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Application Details */}
          <div className="md:col-span-2">
            {selectedApplication ? (
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedApplication.name}</h2>
                    <p className="text-gray-600">{selectedApplication.email} | {selectedApplication.phone}</p>
                  </div>
                  <div>{getStatusBadge(selectedApplication.status)}</div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Application Type</h3>
                    <p>{selectedApplication.mentorType === "YOGAMENTOR" ? "Yoga Mentor" : "Meditation Mentor"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Experience</h3>
                    <p className="whitespace-pre-line">{selectedApplication.experience}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Expertise</h3>
                    <p>{selectedApplication.expertise}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Certifications</h3>
                    <p>{selectedApplication.certifications}</p>
                  </div>
                  
                  {selectedApplication.powUrl && (
                    <div>
                      <h3 className="font-semibold">Proof of Work</h3>
                      <div className="mt-2">
                        <a 
                          href={selectedApplication.powUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4 mr-1" /> View Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {selectedApplication.status === "pending" && (
                  <div className="flex space-x-4 justify-end">
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleStatusUpdate(selectedApplication.id, "rejected")}
                      disabled={processingId === selectedApplication.id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusUpdate(selectedApplication.id, "approved")}
                      disabled={processingId === selectedApplication.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <div>
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-lg font-semibold text-gray-700">No Application Selected</p>
                  <p className="text-gray-500">Select an application from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

