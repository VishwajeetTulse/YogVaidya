"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Shield, UserPlus, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Moderator {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

interface UserPatch {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
}

export const ModeratorManagementSection = () => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [filteredModerators, setFilteredModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingModerator, setEditingModerator] = useState<Moderator | null>(null);
  const [moderatorToDelete, setModeratorToDelete] = useState<Moderator | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state for creating/editing moderator
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "", // Add password field
  });

  useEffect(() => {
    fetchModerators();
  }, []);

  useEffect(() => {
    // Filter moderators based on search term
    if (!searchTerm) {
      setFilteredModerators(moderators);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = moderators.filter(
      (moderator) =>
        moderator.name?.toLowerCase().includes(term) ||
        moderator.email.toLowerCase().includes(term) ||
        moderator.phone?.toLowerCase().includes(term)
    );

    setFilteredModerators(filtered);
  }, [searchTerm, moderators]);

  const fetchModerators = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (data.success && data.users) {
        // Filter out admin users, only show USER, MENTOR roles
        const filteredUsers = data.users.filter((user: Moderator) => user.role === "MODERATOR");
        setModerators(filteredUsers);
        setFilteredModerators(filteredUsers);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModerator = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "", // Reset password field
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditModerator = (moderator: Moderator) => {
    setEditingModerator(moderator);
    setFormData({
      name: moderator.name || "",
      email: moderator.email,
      phone: moderator.phone || "",
      password: "", // Empty password field for edit mode
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteModerator = (moderator: Moderator) => {
    setModeratorToDelete(moderator);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const submitCreateModerator = async () => {
    try {
      // Validate the form
      if (!formData.name || !formData.email || !formData.password) {
        toast.error("Name, email, and password are required");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Password validation - must be at least 8 characters
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "MODERATOR",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          "Moderator created successfully. Credentials have been emailed to the moderator."
        );
        fetchModerators(); // Refresh the list
        setIsCreateDialogOpen(false);
      } else {
        toast.error(`Failed to create moderator: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating moderator:", error);
      toast.error("An error occurred while creating moderator");
    }
  };

  const submitModeratorEdit = async () => {
    if (!editingModerator) return;

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
      const updateData: UserPatch = {
        id: editingModerator.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      // Only include password if it was provided
      if (formData.password && formData.password.trim() !== "") {
        // Password validation - must be at least 8 characters
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters long");
          return;
        }
        updateData.password = formData.password;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Moderator updated successfully");
        // Update the moderator in the local state
        setModerators((mods) =>
          mods.map((m) =>
            m.id === editingModerator.id
              ? {
                  ...m,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                }
              : m
          )
        );
        setIsEditDialogOpen(false);
      } else {
        toast.error(`Failed to update moderator: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating moderator:", error);
      toast.error("An error occurred while updating moderator");
    }
  };

  const confirmDeleteModerator = async () => {
    if (!moderatorToDelete) return;

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: moderatorToDelete.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Moderator deleted successfully");
        setModerators((mods) => mods.filter((m) => m.id !== moderatorToDelete.id));
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(`Failed to delete moderator: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting moderator:", error);
      toast.error("An error occurred while deleting moderator");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderator Management</h1>
          <p className="text-gray-600 mt-2">Manage platform moderators and their permissions.</p>
        </div>
        <Button onClick={handleCreateModerator} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Moderator
        </Button>
      </div>

      <Card className="p-6">
        {/* Search control */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading moderators...</p>
          </div>
        ) : filteredModerators.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-semibold text-gray-700">No Moderators Found</p>
            <p className="text-gray-500">
              {searchTerm
                ? "Try a different search term."
                : "Add moderators to help manage your platform."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full border rounded-md">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 border-b font-medium text-xs uppercase text-gray-500">
                <div>Name</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Created</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div>
                {filteredModerators.map((moderator) => (
                  <div
                    key={moderator.id}
                    className="grid grid-cols-6 gap-2 p-4 border-b hover:bg-gray-50 text-sm"
                  >
                    <div className="truncate">{moderator.name || "-"}</div>
                    <div className="truncate">{moderator.email}</div>
                    <div>{moderator.phone || "-"}</div>
                    <div>{formatDate(moderator.createdAt)}</div>
                    <div>
                      <Badge className="bg-blue-500">Active</Badge>
                    </div>
                    <div className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditModerator(moderator)}
                        className="h-8 px-2 inline-flex items-center"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span className="ml-2">Edit</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteModerator(moderator)}
                        className="h-8 px-2 inline-flex items-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create Moderator Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Moderator</DialogTitle>
            <DialogDescription>
              Create a new moderator account. Credentials will be emailed to the moderator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreateModerator}>Create Moderator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Moderator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Moderator</DialogTitle>
            <DialogDescription>
              Update moderator information. Leave password empty to keep the current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (Optional)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Leave empty to keep current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitModeratorEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Moderator Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this moderator? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {moderatorToDelete && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-6 w-6 text-red-500 mr-4" />
                <div>
                  <p>
                    <strong>Name:</strong> {moderatorToDelete.name || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {moderatorToDelete.email}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModerator}>
              Delete Moderator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
