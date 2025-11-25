"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type Ticket,
  type TicketFilters,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  type TicketListResponse,
} from "@/lib/types/tickets";
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  MoreHorizontal,
  UserPlus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface UserFromAPI {
  id: string;
  name?: string | null;
  email: string;
  role: string;
}

interface TicketsProps {
  userRole: "USER" | "MODERATOR" | "ADMIN";
  currentUserId?: string;
}

export const TicketsSection = ({ userRole, currentUserId }: TicketsProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch tickets based on current filters
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.priority) queryParams.append("priority", filters.priority);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.assigned) queryParams.append("assigned", filters.assigned);
      queryParams.append("page", filters.page?.toString() || "1");
      queryParams.append("limit", filters.limit?.toString() || "10");

      const response = await fetch(`/api/tickets?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data: TicketListResponse = await response.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (key: keyof TicketFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when changing filters
    }));
  };

  const _getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      [TicketStatus.OPEN]: { color: "bg-blue-100 text-blue-800", icon: Clock },
      [TicketStatus.IN_PROGRESS]: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      [TicketStatus.WAITING_FOR_USER]: { color: "bg-orange-100 text-orange-800", icon: User },
      [TicketStatus.RESOLVED]: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      [TicketStatus.CLOSED]: { color: "bg-gray-100 text-gray-800", icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const _getPriorityBadge = (priority: TicketPriority) => {
    const priorityConfig = {
      [TicketPriority.LOW]: "bg-gray-100 text-gray-600",
      [TicketPriority.MEDIUM]: "bg-blue-100 text-blue-600",
      [TicketPriority.HIGH]: "bg-orange-100 text-orange-600",
      [TicketPriority.URGENT]: "bg-red-100 text-red-600",
    };

    return <Badge className={priorityConfig[priority]}>{priority}</Badge>;
  };

  const _getCategoryColor = (category: TicketCategory) => {
    const categoryColors = {
      [TicketCategory.SUBSCRIPTION_ISSUE]: "text-purple-600",
      [TicketCategory.PAYMENT_PROBLEM]: "text-red-600",
      [TicketCategory.MENTOR_APPLICATION]: "text-blue-600",
      [TicketCategory.TECHNICAL_SUPPORT]: "text-green-600",
      [TicketCategory.ACCOUNT_ISSUE]: "text-orange-600",
      [TicketCategory.REFUND_REQUEST]: "text-pink-600",
      [TicketCategory.GENERAL_INQUIRY]: "text-gray-600",
      [TicketCategory.BUG_REPORT]: "text-red-600",
      [TicketCategory.FEATURE_REQUEST]: "text-indigo-600",
    };

    return categoryColors[category] || "text-gray-600";
  };

  if (loading) {
    return <TicketsLoading />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">Manage customer support requests</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="text-lg font-medium">Failed to load tickets</h3>
          <p className="mt-2">Error: {error}</p>
          <Button onClick={() => fetchTickets()} className="mt-3" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">
            {userRole === "USER"
              ? "View and manage your support requests"
              : "Manage customer support tickets"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={fetchTickets}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Create Ticket Button */}
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {userRole === "USER" ? "Create Ticket" : "New Ticket"}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              handleFilterChange("status", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(TicketStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={filters.priority || "all"}
            onValueChange={(value) =>
              handleFilterChange("priority", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.values(TicketPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              handleFilterChange("category", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(TicketCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignment Filter (Moderator/Admin only) */}
          {(userRole === "MODERATOR" || userRole === "ADMIN") && (
            <Select
              value={filters.assigned || "all"}
              onValueChange={(value) =>
                handleFilterChange("assigned", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="true">Assigned to Me</SelectItem>
                <SelectItem value="false">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {userRole === "USER"
                ? "You haven't created any support tickets yet."
                : "No tickets match your current filters."}
            </p>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              userRole={userRole}
              currentUserId={currentUserId}
              onUpdate={fetchTickets}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => handleFilterChange("page", pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handleFilterChange("page", pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Ticket Modal would go here */}
      {showCreateForm && (
        <CreateTicketModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
};

// Individual Ticket Card Component
interface TicketCardProps {
  ticket: Ticket;
  userRole: "USER" | "MODERATOR" | "ADMIN";
  currentUserId?: string;
  onUpdate: () => void;
}

const TicketCard = ({ ticket, userRole, currentUserId, onUpdate }: TicketCardProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [assigneeId, setAssigneeId] = useState(ticket.assignedToId || "UNASSIGNED");
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [availableModerators, setAvailableModerators] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [loadingModerators, setLoadingModerators] = useState(false);

  // Ref for dropdown menu
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };

    if (isActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isActionsOpen]);

  // Fetch moderators when assign dialog opens
  const fetchModerators = async () => {
    try {
      setLoadingModerators(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter for moderators only (tickets should be assigned to moderators to resolve)
        const moderators = data.users
          .filter((user: UserFromAPI) => user.role === "MODERATOR")
          .map((user: UserFromAPI) => ({
            id: user.id,
            name: user.name || "Unnamed User",
            email: user.email,
          }));
        setAvailableModerators(moderators);
      }
    } catch (error) {
      console.error("Error fetching moderators:", error);
    } finally {
      setLoadingModerators(false);
    }
  };

  // Fetch moderators when assign dialog opens
  useEffect(() => {
    if (isAssignDialogOpen && userRole === "ADMIN") {
      fetchModerators();
    }
  }, [isAssignDialogOpen, userRole]);

  const handleAssignTicket = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId === "UNASSIGNED" ? null : assigneeId }),
      });

      if (response.ok) {
        const successMessage =
          assigneeId === "UNASSIGNED"
            ? "Ticket unassigned successfully"
            : "Ticket assigned successfully";
        toast.success(successMessage);
        setIsAssignDialogOpen(false);
        onUpdate();
      } else {
        toast.error("Failed to assign ticket");
      }
    } catch {
      toast.error("Error assigning ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === ticket.status) {
      toast.error("Status is already set to this value");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Ticket status updated successfully");
        setIsStatusDialogOpen(false);
        onUpdate();
      } else {
        toast.error("Failed to update ticket status");
      }
    } catch {
      toast.error("Error updating ticket status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      [TicketStatus.OPEN]: { color: "bg-blue-100 text-blue-800", icon: Clock },
      [TicketStatus.IN_PROGRESS]: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      [TicketStatus.WAITING_FOR_USER]: { color: "bg-orange-100 text-orange-800", icon: User },
      [TicketStatus.RESOLVED]: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      [TicketStatus.CLOSED]: { color: "bg-gray-100 text-gray-800", icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const priorityConfig = {
      [TicketPriority.LOW]: "bg-gray-100 text-gray-600",
      [TicketPriority.MEDIUM]: "bg-blue-100 text-blue-600",
      [TicketPriority.HIGH]: "bg-orange-100 text-orange-600",
      [TicketPriority.URGENT]: "bg-red-100 text-red-600",
    };

    return <Badge className={priorityConfig[priority]}>{priority}</Badge>;
  };

  const canPerformActions = userRole === "MODERATOR" || userRole === "ADMIN";
  const isAssignedToMe = ticket.assignedToId === currentUserId;

  return (
    <Card
      className={`p-6 shadow-sm hover:shadow-md transition-shadow ${
        isAssignedToMe ? "border-2 border-blue-500 bg-blue-50/30" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              {ticket.title}
            </h3>
            <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
            <Badge variant="outline" className="text-xs">
              {ticket.category.replace("_", " ")}
            </Badge>
            {isAssignedToMe && (
              <Badge className="text-xs bg-blue-500 text-white">Assigned to Me</Badge>
            )}
          </div>
        </div>

        {/* Actions Dropdown */}
        {canPerformActions && (
          <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" size="sm" onClick={() => setIsActionsOpen(!isActionsOpen)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {isActionsOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
                <div className="py-1">
                  {/* Assignment is only available to admins and for non-resolved tickets */}
                  {userRole === "ADMIN" &&
                    ticket.status !== TicketStatus.RESOLVED &&
                    ticket.status !== TicketStatus.CLOSED && (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => {
                          setIsActionsOpen(false);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign Ticket
                      </button>
                    )}

                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      setIsActionsOpen(false);
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Update Status
                  </button>
                </div>
              </div>
            )}

            {/* Dialogs - moved outside the dropdown */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Assign to Moderator (for resolution)</Label>
                    <Select
                      value={assigneeId}
                      onValueChange={setAssigneeId}
                      disabled={loadingModerators}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingModerators ? "Loading moderators..." : "Select a moderator"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {loadingModerators ? (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            Loading moderators...
                          </div>
                        ) : (
                          availableModerators.map((mod) => (
                            <SelectItem key={mod.id} value={mod.id}>
                              {mod.name} ({mod.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignTicket} disabled={isUpdating || loadingModerators}>
                      {isUpdating ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Ticket Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>New Status</Label>
                    <Select
                      value={newStatus}
                      onValueChange={(value) => setNewStatus(value as TicketStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                        <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TicketStatus.WAITING_FOR_USER}>
                          Waiting for User
                        </SelectItem>
                        <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                        <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{ticket.user.name || ticket.user.email}</span>
          </div>

          {ticket.assignedTo && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Assigned to {ticket.assignedTo.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
          </div>

          {/* Quick Actions for Moderators */}
          {canPerformActions && (
            <div className="flex items-center gap-1 ml-4">
              {ticket.status === TicketStatus.OPEN && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: TicketStatus.IN_PROGRESS }),
                      });
                      if (response.ok) {
                        toast.success("Ticket moved to In Progress");
                        onUpdate();
                      } else {
                        toast.error("Failed to update ticket");
                      }
                    } catch {
                      toast.error("Error updating ticket");
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className="text-xs px-2 py-1 h-6"
                >
                  Start Work
                </Button>
              )}

              {ticket.status === TicketStatus.IN_PROGRESS && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: TicketStatus.RESOLVED }),
                      });
                      if (response.ok) {
                        toast.success("Ticket marked as resolved");
                        onUpdate();
                      } else {
                        toast.error("Failed to update ticket");
                      }
                    } catch {
                      toast.error("Error updating ticket");
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className="text-xs px-2 py-1 h-6 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Resolve
                </Button>
              )}

              {!ticket.assignedToId &&
                userRole === "ADMIN" &&
                ticket.status !== TicketStatus.RESOLVED &&
                ticket.status !== TicketStatus.CLOSED && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="text-xs px-2 py-1 h-6 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Assign
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Create Ticket Modal Placeholder
const CreateTicketModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New Ticket</h2>
        <p className="text-gray-600 mb-4">Ticket creation form will be implemented here.</p>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onSuccess}>Create Ticket</Button>
        </div>
      </div>
    </div>
  );
};

// Loading Component
const TicketsLoading = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-2">Manage customer support requests</p>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>

    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
