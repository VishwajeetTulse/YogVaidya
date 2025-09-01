"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLogger } from "@/hooks/use-logger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  UserCog,
  Trash2,
  Edit,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export const UsersSection = () => {
  const { logInfo, logWarning, logError } = useLogger();
  
  // Debug the logger hook
  console.log("🔍 useLogger hook initialized (Users Section):", {
    logInfo: typeof logInfo,
    logWarning: typeof logWarning,
    logError: typeof logError
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN"); // Default to ADMIN, will be updated
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showEditRoleFilter, setShowEditRoleFilter] = useState(false);

  // Form state for editing user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (data.success && data.users) {
        // Filter users to only include regular users (exclude mentors, admins, moderators)
        const filteredByPermission = data.users.filter(
          (user: User) => user.role === "USER"
        );
        setUsers(filteredByPermission);
        setFilteredUsers(filteredByPermission);
        
        // Try to detect current user role
        try {
          const roleRes = await fetch("/api/auth/get-session");
          const roleData = await roleRes.json();
          if (roleData?.user?.role) {
            setCurrentUserRole(roleData.user.role);
            console.log("🔍 Detected current user role (Users):", roleData.user.role);
          }
        } catch (roleError) {
          console.warn("Could not detect user role, defaulting to ADMIN:", roleError);
        }
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term and role filter
      let result = [...users];

      // Apply role filter
      if (roleFilter !== "ALL") {
        result = result.filter((user) => user.role === roleFilter);
      }

      // Apply search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (user) =>
            user.name?.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.phone?.toLowerCase().includes(term)
        );
      }

      setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  const handleEditUser = (user: User) => {
    // Prevent editing ADMIN or MODERATOR users
    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      toast.error("You don't have permission to edit this user");
      return;
    }

    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    // Prevent deleting ADMIN or MODERATOR users
    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      toast.error("You don't have permission to delete this user");
      return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value,
    });
  };

  const submitUserEdit = async () => {
    if (!editingUser) return;

    // Prevent editing ADMIN or MODERATOR users
    if (editingUser.role === "ADMIN" || editingUser.role === "MODERATOR") {
      toast.error("You don't have permission to edit this user");
      setIsEditDialogOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ User update API call succeeded");
        toast.success("User updated successfully");
        
        // Log user update with debugging
        console.log("🔍 Attempting to log user update...");
        console.log("🔍 logInfo function exists:", typeof logInfo);
        console.log("🔍 Form data:", formData);
        
        try {
          const logResult = await logInfo(
            "USER_PROFILE_UPDATED",
            currentUserRole,
            `Updated user profile: ${formData.email}`,
            {
              userId: editingUser.id,
              userEmail: formData.email,
              updatedFields: {
                name: formData.name,
                phone: formData.phone,
                role: formData.role
              },
              updateDate: new Date().toISOString()
            }
          );
          console.log("✅ User update log result:", logResult);
        } catch (logError) {
          console.error("❌ User update logging failed:", logError);
          toast.error("Failed to log the user update. Check console for details.");
        }
        
        setUsers(
          users.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  role: formData.role,
                }
              : u
          )
        );
        setIsEditDialogOpen(false);
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred while updating user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    // Prevent deleting ADMIN or MODERATOR users
    if (userToDelete.role === "ADMIN" || userToDelete.role === "MODERATOR") {
      toast.error("You don't have permission to delete this user");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userToDelete.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ User delete API call succeeded");
        toast.success("User deleted successfully");
        
        // Log user deletion with debugging
        console.log("🔍 Attempting to log user deletion...");
        
        try {
          const logResult = await logWarning(
            "USER_ACCOUNT_DELETED",
            currentUserRole,
            `Deleted user account: ${userToDelete.email}`,
            {
              deletedUserId: userToDelete.id,
              deletedUserEmail: userToDelete.email,
              deletedUserName: userToDelete.name,
              deletedUserRole: userToDelete.role,
              deletionDate: new Date().toISOString()
            }
          );
          console.log("✅ User deletion log result:", logResult);
        } catch (logError) {
          console.error("❌ User deletion logging failed:", logError);
          toast.error("Failed to log the user deletion. Check console for details.");
        }
        
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting user");
    }
  };
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "USER":
      default:
        return <Badge className="bg-gray-500">User</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage regular platform users and their accounts. (Mentors are managed in the separate Mentor Management section)
        </p>
      </div>

      <Card className="p-6">
        {/* Filter and search controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {" "}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              className="w-full sm:w-[180px] flex justify-between items-center"
              onClick={() => setShowRoleFilter(!showRoleFilter)}
            >
              <span>{roleFilter === "ALL" ? "All Users" : "Regular Users"}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>{" "}
            {showRoleFilter && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                <div
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setRoleFilter("ALL");
                    setShowRoleFilter(false);
                  }}
                >
                  All Users
                </div>
                <div
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setRoleFilter("USER");
                    setShowRoleFilter(false);
                  }}
                >
                  Regular Users
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-10">
            <UserCog className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-semibold text-gray-700">
              No Users Found
            </p>
            <p className="text-gray-500">
              Try a different search term or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full border rounded-md">
              {" "}
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 border-b font-medium text-xs uppercase text-gray-500">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Created</div>
                <div className="text-right">Actions</div>
              </div>
              {/* Table Body */}
              <div>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-5 gap-2 p-4 border-b hover:bg-gray-50 text-sm"
                  >
                    <div className="truncate">{user.name || "-"}</div>
                    <div className="truncate">{user.email}</div>
                    <div>{getRoleBadge(user.role)}</div>
                    <div>{formatDate(user.createdAt)}</div>
                    <div className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 px-2 inline-flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 px-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 inline-flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user&apos;s information. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full flex justify-between"
                  onClick={() => setShowEditRoleFilter(!showEditRoleFilter)}
                >
                  {formData.role}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>{" "}
                {showEditRoleFilter && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                    <div
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleRoleChange("USER");
                        setShowEditRoleFilter(false);
                      }}
                    >
                      Regular User
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitUserEdit}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <div className="space-y-1">
                <p className="font-medium">
                  {userToDelete.name || "Unnamed user"}
                </p>
                <p className="text-sm text-gray-600">{userToDelete.email}</p>
                <p className="text-sm text-gray-600">
                  Role: {userToDelete.role}
                </p>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-red-600">
                This will delete the user account and all associated mentor
                applications.
              </p>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteUser}
              >
                Delete User
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

