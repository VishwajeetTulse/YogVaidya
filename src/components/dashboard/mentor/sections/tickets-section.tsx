"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  User,
  Calendar,
  Tag,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export const TicketsSection = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const itemsPerPage = 10;

  // Create ticket form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>(TicketCategory.GENERAL_INQUIRY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.priority) queryParams.append("priority", filters.priority);

      const response = await fetch(`/api/tickets?${queryParams}`);
      if (response.ok) {
        const data: TicketListResponse = await response.json();
        setTickets(data.tickets);
        setTotalTickets(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (key: keyof TicketFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
        }),
      });

      if (response.ok) {
        toast.success("Ticket created successfully");
        setIsCreateDialogOpen(false);
        setTitle("");
        setDescription("");
        setCategory(TicketCategory.GENERAL_INQUIRY);
        fetchTickets();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const statusStyles = {
      [TicketStatus.OPEN]: "bg-blue-100 text-blue-800",
      [TicketStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800",
      [TicketStatus.WAITING_FOR_USER]: "bg-orange-100 text-orange-800",
      [TicketStatus.RESOLVED]: "bg-green-100 text-green-800",
      [TicketStatus.CLOSED]: "bg-gray-100 text-gray-800",
    };

    return <Badge className={statusStyles[status]}>{status.replace(/_/g, " ")}</Badge>;
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const priorityStyles = {
      [TicketPriority.LOW]: "bg-gray-100 text-gray-800",
      [TicketPriority.MEDIUM]: "bg-blue-100 text-blue-800",
      [TicketPriority.HIGH]: "bg-orange-100 text-orange-800",
      [TicketPriority.URGENT]: "bg-red-100 text-red-800",
    };

    return <Badge className={priorityStyles[priority]}>{priority}</Badge>;
  };

  const totalPages = Math.ceil(totalTickets / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get help when you need it. We&apos;re here to support your wellness journey.
        </p>
      </div>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Support Hours</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
              <p>Saturday: 10:00 AM - 4:00 PM IST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Contact Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#876aff]" />
                <span className="font-medium text-[#876aff]">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#876aff]" />
                <span className="font-medium text-[#876aff]">support@yogavaidya.com</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Support Tickets Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage your support requests and get help</p>
        </div>

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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your issue"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as TicketCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketCategory.GENERAL_INQUIRY}>
                        General Inquiry
                      </SelectItem>
                      <SelectItem value={TicketCategory.TECHNICAL_SUPPORT}>
                        Technical Support
                      </SelectItem>
                      <SelectItem value={TicketCategory.PAYMENT_PROBLEM}>
                        Payment Problem
                      </SelectItem>
                      <SelectItem value={TicketCategory.ACCOUNT_ISSUE}>Account Issue</SelectItem>
                      <SelectItem value={TicketCategory.BUG_REPORT}>Bug Report</SelectItem>
                      <SelectItem value={TicketCategory.FEATURE_REQUEST}>
                        Feature Request
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <Label>Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TicketStatus.WAITING_FOR_USER}>Waiting for User</SelectItem>
                <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Label>Priority</Label>
            <Select
              value={filters.priority || "all"}
              onValueChange={(value) =>
                handleFilterChange("priority", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
          ))
        ) : tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.keys(filters).length > 0
                ? "Try adjusting your search or filters"
                : "You haven't created any support tickets yet"}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Ticket</Button>
            )}
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {ticket.ticketNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {ticket.category.replace(/_/g, " ")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  {ticket.assignedTo && (
                    <div className="text-blue-600">Assigned to: {ticket.assignedTo.name}</div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
