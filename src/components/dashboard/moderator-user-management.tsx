"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const roles = ["USER", "MENTOR"];

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export default function ModeratorUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        // Only show users with role USER or MENTOR
        setUsers(data.users.filter((u:User) => roles.includes(u.role)).map((u: User) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
        })));
      } else toast.error("Failed to load users");
    } catch (e) {
      toast.error((e as Error)?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user: User) {
    setEditId(user.id);
    setEditData({ ...user });
  }

  function cancelEdit() {
    setEditId(null);
    setEditData({});
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  }

  async function saveEdit() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated");
        setUsers(users.map(u => u.id === editData.id ? data.user : u));
        cancelEdit();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch (e) {
      toast.error((e as Error)?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        setUsers(users.filter(u => u.id !== id));
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (e) {
      toast.error((e as Error)?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow mt-10">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                {editId === user.id ? (
                  <>
                    <td className="p-2"><Input name="name" value={editData.name || ""} onChange={handleEditChange} /></td>
                    <td className="p-2"><Input name="email" value={editData.email || ""} onChange={handleEditChange} /></td>
                    <td className="p-2"><Input name="phone" value={editData.phone || ""} onChange={handleEditChange} /></td>
                    <td className="p-2">
                      <select name="role" value={editData.role} onChange={handleEditChange} className="border rounded px-2 py-1">
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={actionLoading}>Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} disabled={actionLoading}>Cancel</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.phone}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(user)} disabled={actionLoading}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)} disabled={actionLoading}>Delete</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
