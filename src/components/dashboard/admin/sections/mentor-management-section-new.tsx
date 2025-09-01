"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  ArrowRightLeft,
  Database,
  Edit,
  Search,
  Trash2,
  Plus,
  Eye
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
import { syncMentorTypes, getMentorStats } from "@/lib/services/mentor-sync";
import { LucideIcon } from "lucide-react";

interface MentorStats {
  totalMentors: number;
  mentorsWithType: number;
  mentorsWithoutType: number;
  approvedApplications: number;
  yogaMentors: number;
  meditationMentors: number;
  dietPlanners: number;
  typeConsistency: boolean;
}

interface Mentor {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  experience: string | null;
  specialization: string | null;
  bio: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MentorPatch {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  specialization?: string;
  bio?: string;
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
  <Card className={onClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""} onClick={onClick}>
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
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
    experience: "",
    specialization: "",
    bio: "",
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
        mentor.specialization?.toLowerCase().includes(term) ||
        mentor.experience?.toLowerCase().includes(term)
    );

    setFilteredMentors(filtered);
  }, [searchTerm, mentors]);

  const fetchMentors = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (data.success && data.users) {
        // Filter only mentors
        const mentorUsers = data.users.filter(
          (user: Mentor) => user.role === "MENTOR"
        );
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
      experience: mentor.experience || "",
      specialization: mentor.specialization || "",
      bio: mentor.bio || "",
      isAvailable: mentor.isAvailable,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMentor = (mentor: Mentor) => {
    setMentorToDelete(mentor);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        experience: formData.experience,
        specialization: formData.specialization,
        bio: formData.bio,
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
        // Update the mentor in the local state
        setMentors((mentors) =>
          mentors.map((m) =>
            m.id === editingMentor.id
              ? {
                  ...m,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  experience: formData.experience,
                  specialization: formData.specialization,
                  bio: formData.bio,
                  isAvailable: formData.isAvailable,
                }
              : m
          )
        );
        setIsEditDialogOpen(false);
        // Refresh stats after edit
        loadMentorStats();
      } else {
        toast.error(
          `Failed to update mentor: ${data.error || "Unknown error"}`
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
        setMentors((mentors) =>
          mentors.filter((m) => m.id !== mentorToDelete.id)
        );
        setIsDeleteDialogOpen(false);
        // Refresh stats after deletion
        loadMentorStats();
      } else {
        toast.error(
          `Failed to delete mentor: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast.error("An error occurred while deleting mentor");
    }
  };

  const handleSyncMentorTypes = async () => {
    setSyncing(true);
    try {
      const result = await syncMentorTypes();
      if (result.success) {
        toast.success("Mentor types synced successfully");
        await loadMentorStats();
      } else {
        toast.error("Failed to sync mentor types");
      }
    } catch (error) {
      console.error("Error syncing mentor types:", error);
      toast.error("An error occurred while syncing");
    } finally {
      setSyncing(false);
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
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading mentor statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <CardDescription>
            Breakdown of mentors by specialization type
          </CardDescription>
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

      {/* Type Consistency Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Consistency
          </CardTitle>
          <CardDescription>
            Monitor and maintain mentor type consistency across applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stats?.typeConsistency ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    All mentor types are consistent
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">
                    Type inconsistencies detected
                  </span>
                </>
              )}
            </div>
            <Button
              onClick={handleSyncMentorTypes}
              disabled={syncing}
              variant="outline"
              size="sm"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Types
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mentor List */}
      {showMentorList && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Mentor Management
                </CardTitle>
                <CardDescription>
                  View and edit mentor details
                </CardDescription>
              </div>
              <Button onClick={toggleMentorList} variant="outline" size="sm">
                Hide List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Mentor List */}
            <div className="space-y-4">
              {filteredMentors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No mentors found matching your search.
                </p>
              ) : (
                filteredMentors.map((mentor) => (
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
                      {mentor.specialization && (
                        <p className="text-sm text-blue-600">{mentor.specialization}</p>
                      )}
                      {mentor.experience && (
                        <p className="text-xs text-muted-foreground">
                          Experience: {mentor.experience}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEditMentor(mentor)}
                        size="sm"
                        variant="outline"
                      >
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
                ))
              )}
            </div>
          </CardContent>
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
              <Label htmlFor="specialization">Specialization</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialization: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOGA">Yoga</SelectItem>
                  <SelectItem value="MEDITATION">Meditation</SelectItem>
                  <SelectItem value="DIET_PLANNER">Diet Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleFormChange}
                placeholder="e.g., 5 years in yoga instruction"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleFormChange}
                placeholder="Enter mentor bio"
                rows={3}
              />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
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
              Are you sure you want to delete {mentorToDelete?.name || "this mentor"}? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteMentor}
            >
              Delete Mentor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
