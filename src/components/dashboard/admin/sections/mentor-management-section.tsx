"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLogger } from "@/hooks/use-logger";
import {
  Users,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ArrowRightLeft,
  Edit,
  Search,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getMentorStats } from "@/lib/services/mentor-sync";
import { Skeleton } from "@/components/ui/skeleton";

interface MentorStats {
  totalMentors: number;
  mentorsWithType: number;
  mentorsWithoutType: number;
  approvedApplications: number;
  yogaMentors: number;
  meditationMentors: number;
  dietPlanners: number;
}

interface Mentor {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  mentorType: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MentorPatch {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  mentorType?: string;
  isAvailable?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const StatCard = ({ title, value, description, icon, onClick }: StatCardProps) => (
  <Card
    className={onClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export const MentorManagementSection = () => {
  const { logInfo, logWarning, logError } = useLogger();

  const [stats, setStats] = useState<MentorStats | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN"); // Default to ADMIN, will be updated
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [mentorToDelete, setMentorToDelete] = useState<Mentor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showMentorList, setShowMentorList] = useState(false);

  // Form state for editing mentor
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mentorType: "",
    isAvailable: true,
  });

  useEffect(() => {
    loadMentorStats();
    if (showMentorList) {
      fetchMentors();
    }
  }, [showMentorList]);

  useEffect(() => {
    // Filter mentors based on search term
    if (!searchTerm) {
      setFilteredMentors(mentors);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = mentors.filter(
      (mentor) =>
        mentor.name?.toLowerCase().includes(term) ||
        mentor.email.toLowerCase().includes(term) ||
        mentor.mentorType?.toLowerCase().includes(term)
    );

    setFilteredMentors(filtered);
  }, [searchTerm, mentors]);

  const fetchMentors = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (data.success && data.users) {
        // Filter only mentors
        const mentorUsers = data.users.filter((user: Mentor) => user.role === "MENTOR");

        // Try to detect current user role from the response or make a separate call
        // The /api/users endpoint returns all users, so we can check if we have permission
        // If we got a successful response, we know we have ADMIN or MODERATOR role
        // We'll need to make a separate call to get the exact role
        try {
          const roleRes = await fetch("/api/auth/get-session");
          const roleData = await roleRes.json();
          if (roleData?.user?.role) {
            setCurrentUserRole(roleData.user.role);
          }
        } catch (roleError) {
          console.warn("Could not detect user role, defaulting to ADMIN:", roleError);
        }
        setMentors(mentorUsers);
        setFilteredMentors(mentorUsers);
      } else {
        toast.error("Failed to load mentors");
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
      toast.error("An error occurred while fetching mentors");
    }
  };

  const loadMentorStats = async () => {
    setLoading(true);
    try {
      const result = await getMentorStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        toast.error("Failed to load mentor statistics");
      }
    } catch (error) {
      console.error("Error loading mentor stats:", error);
      toast.error("An error occurred while loading statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMentor = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name || "",
      email: mentor.email,
      phone: mentor.phone || "",
      mentorType: mentor.mentorType || "",
      isAvailable: mentor.isAvailable,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMentor = (mentor: Mentor) => {
    setMentorToDelete(mentor);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvailabilityChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isAvailable: checked,
    });
  };

  const submitMentorEdit = async () => {
    if (!editingMentor) return;

    try {
      // Validate the form
      if (!formData.name || !formData.email) {
        toast.error("Name and email are required");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Prepare the update payload
      const updateData: MentorPatch = {
        id: editingMentor.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        mentorType: formData.mentorType,
        isAvailable: formData.isAvailable,
      };

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Mentor updated successfully");

        // Log mentor update
        try {
          await logInfo(
            "MENTOR_PROFILE_UPDATED",
            currentUserRole,
            `Updated mentor profile: ${formData.email}`,
            {
              mentorId: editingMentor.id,
              mentorEmail: formData.email,
              updatedFields: {
                name: formData.name,
                phone: formData.phone,
                mentorType: formData.mentorType,
                isAvailable: formData.isAvailable,
              },
              updateDate: new Date().toISOString(),
            }
          );
        } catch (logError) {
          console.error("❌ Logging failed:", logError);
          toast.error("Failed to log the update. Check console for details.");
        }

        // Update the mentor in the local state
        setMentors((mentors) =>
          mentors.map((m) =>
            m.id === editingMentor.id
              ? {
                  ...m,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  mentorType: formData.mentorType,
                  isAvailable: formData.isAvailable,
                }
              : m
          )
        );
        setIsEditDialogOpen(false);
        // Refresh stats after edit
        loadMentorStats();
      } else {
        toast.error(`Failed to update mentor: ${data.error || "Unknown error"}`);

        // Log mentor update failure
        await logError(
          "MENTOR_UPDATE_FAILED",
          "ADMIN",
          `Failed to update mentor: ${formData.email}`,
          {
            mentorId: editingMentor.id,
            mentorEmail: formData.email,
            error: data.error || "Unknown error",
            attemptedUpdates: formData,
          }
        );
      }
    } catch (error) {
      console.error("Error updating mentor:", error);
      toast.error("An error occurred while updating mentor");
    }
  };

  const confirmDeleteMentor = async () => {
    if (!mentorToDelete) return;

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mentorToDelete.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Mentor deleted successfully");

        // Log mentor deletion
        await logWarning(
          "MENTOR_DELETED",
          currentUserRole,
          `Deleted mentor: ${mentorToDelete.email}`,
          {
            mentorId: mentorToDelete.id,
            mentorEmail: mentorToDelete.email,
            mentorName: mentorToDelete.name,
            mentorType: mentorToDelete.mentorType,
            deletionDate: new Date().toISOString(),
            reason: `${currentUserRole.toLowerCase()}_action`,
          }
        );

        setMentors((mentors) => mentors.filter((m) => m.id !== mentorToDelete.id));
        setIsDeleteDialogOpen(false);
        // Refresh stats after deletion
        loadMentorStats();
      } else {
        toast.error(`Failed to delete mentor: ${data.error || "Unknown error"}`);

        // Log mentor deletion failure
        await logError(
          "MENTOR_DELETION_FAILED",
          currentUserRole,
          `Failed to delete mentor: ${mentorToDelete.email}`,
          {
            mentorId: mentorToDelete.id,
            mentorEmail: mentorToDelete.email,
            error: data.error || "Unknown error",
          }
        );
      }
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast.error("An error occurred while deleting mentor");
    }
  };

  const toggleMentorList = () => {
    setShowMentorList(!showMentorList);
    if (!showMentorList) {
      fetchMentors();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Distribution Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Management</h1>
          <p className="text-gray-600 mt-2">Manage platform mentors and their information.</p>
        </div>
        <Button onClick={toggleMentorList} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {showMentorList ? "Hide Mentors" : "View Mentors"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Mentors"
          value={stats?.totalMentors || 0}
          description="Active mentors in system"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          onClick={toggleMentorList}
        />
        <StatCard
          title="With Type Assignment"
          value={stats?.mentorsWithType || 0}
          description="Mentors with specializations"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          title="Without Type"
          value={stats?.mentorsWithoutType || 0}
          description="Needs type assignment"
          icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
        />
        <StatCard
          title="Applications"
          value={stats?.approvedApplications || 0}
          description="Approved applications"
          icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
        />
      </div>

      {/* Mentor Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Mentor Type Distribution
          </CardTitle>
          <CardDescription>Breakdown of mentors by specialization type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Yoga Mentors</span>
              <Badge variant="secondary">{stats?.yogaMentors || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Meditation Mentors</span>
              <Badge variant="secondary">{stats?.meditationMentors || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Diet Planners</span>
              <Badge variant="secondary">{stats?.dietPlanners || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentor List */}
      {showMentorList && (
        <Card className="p-6">
          {/* Search control */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search mentors by name, email, or mentor type..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredMentors.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-semibold text-gray-700">No Mentors Found</p>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try a different search term."
                  : "No mentors available in the system."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{mentor.name || "Unnamed Mentor"}</h4>
                      <Badge variant={mentor.isAvailable ? "default" : "secondary"}>
                        {mentor.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{mentor.email}</p>
                    {mentor.mentorType && (
                      <p className="text-sm text-blue-600">{mentor.mentorType}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleEditMentor(mentor)} size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteMentor(mentor)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Edit Mentor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mentor</DialogTitle>
            <DialogDescription>
              Update mentor information and availability status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Enter mentor name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="mentorType">Mentor Type</Label>
              <Select
                value={formData.mentorType}
                onValueChange={(value) => setFormData({ ...formData, mentorType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOGAMENTOR">Yoga Mentor</SelectItem>
                  <SelectItem value="MEDITATIONMENTOR">Meditation Mentor</SelectItem>
                  <SelectItem value="DIETPLANNER">Diet Planner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={handleAvailabilityChange}
              />
              <Label htmlFor="isAvailable">Available for sessions</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitMentorEdit}>
              Update Mentor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mentor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {mentorToDelete?.name || "this mentor"}? This action
              cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteMentor}>
              Delete Mentor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
