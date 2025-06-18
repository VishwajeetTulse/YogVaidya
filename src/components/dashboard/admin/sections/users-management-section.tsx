"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  UserCog, 
  Edit, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  User 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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

export const UserManagementSection = () => {
  const [users, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term and role filter
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (data.success && data.users) {
        // Filter out admin users, only show USER, MENTOR roles
        const filteredUsers = data.users.filter((user: User) => 
          user.role === "USER" || user.role === "MENTOR"
        );
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
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

  const filterUsers = () => {
    let result = [...users];
    
    // Apply role filter
    if (roleFilter !== "ALL") {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term)
      );
    }
    
    setFilteredUsers(result);
  };

  const handleEditUser = (user: User) => {
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
        toast.success("User updated successfully");
        setUsers(users.map(u => 
          u.id === editingUser.id 
            ? { ...u, name: formData.name, email: formData.email, phone: formData.phone, role: formData.role } 
            : u
        ));
        setIsEditDialogOpen(false);
      } else {
        toast.error(`Failed to update user: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred while updating user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
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
        toast.success("User deleted successfully");
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(`Failed to delete user: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting user");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MENTOR":
        return <Badge className="bg-green-500">Mentor</Badge>;
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
          Comprehensive user administration and account management.
        </p>
      </div>

      <Card className="p-6">
        {/* Filter and search controls */}
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
          <div className="relative">
            <Button 
              variant="outline" 
              className="w-full sm:w-[180px] flex justify-between items-center"
              onClick={() => setShowRoleFilter(!showRoleFilter)}
            >
              <span>{roleFilter === "ALL" ? "All Roles" : roleFilter}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {showRoleFilter && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                <div 
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => { setRoleFilter("ALL"); setShowRoleFilter(false); }}
                >
                  All Roles
                </div>
                <div 
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => { setRoleFilter("USER"); setShowRoleFilter(false); }}
                >
                  Users
                </div>
                <div 
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => { setRoleFilter("MENTOR"); setShowRoleFilter(false); }}
                >
                  Mentors
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
            <p className="mt-2 text-lg font-semibold text-gray-700">No Users Found</p>
            <p className="text-gray-500">Try a different search term or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full border rounded-md">
              {/* Table Header - Removed subscription column */}
              <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 border-b font-medium text-xs uppercase text-gray-500">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Created</div>
                <div className="text-right">Actions</div>
              </div>
              
              {/* Table Body - Removed subscription cell */}
              <div>
                {filteredUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-5 gap-2 p-4 border-b hover:bg-gray-50 text-sm">
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
                        <Edit className="h-3.5 w-3.5" />
                        <span className="ml-2">Edit</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
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
              <Label>Role</Label>
              <div className="relative">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setShowEditRoleFilter(!showEditRoleFilter)}
                >
                  <span>{formData.role}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                {showEditRoleFilter && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                    <div 
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => { handleRoleChange("USER"); setShowEditRoleFilter(false); }}
                    >
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      User
                    </div>
                    <div 
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => { handleRoleChange("MENTOR"); setShowEditRoleFilter(false); }}
                    >
                      <User className="h-4 w-4 mr-2 text-green-500" />
                      Mentor
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitUserEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userToDelete && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-6 w-6 text-red-500 mr-4" />
                <div>
                  <p><strong>Name:</strong> {userToDelete.name || "N/A"}</p>
                  <p><strong>Email:</strong> {userToDelete.email}</p>
                  <p><strong>Role:</strong> {userToDelete.role}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
