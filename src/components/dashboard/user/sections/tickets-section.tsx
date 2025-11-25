"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  type Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  type CreateTicketRequest,
} from "@/lib/types/tickets";
import type { SectionProps } from "../types";
import { DashboardSkeleton } from "../../unified/dashboard-skeleton";

export function UserTicketsSection({}: SectionProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New ticket form state
  const [newTicket, setNewTicket] = useState<Partial<CreateTicketRequest>>({
    title: "",
    description: "",
    category: TicketCategory.GENERAL_INQUIRY,
    priority: TicketPriority.MEDIUM,
  });

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const response = await fetch(`/api/tickets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error("Failed to fetch tickets:", data.error);
        toast.error("Failed to load tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Error loading tickets");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, priorityFilter, categoryFilter]);

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!newTicket.title?.trim() || !newTicket.description?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTicket),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Ticket created successfully!");
        setIsCreateDialogOpen(false);
        setNewTicket({
          title: "",
          description: "",
          category: TicketCategory.GENERAL_INQUIRY,
          priority: TicketPriority.MEDIUM,
        });
        fetchTickets(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Error creating ticket");
    } finally {
      setCreating(false);
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case TicketStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case TicketStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case TicketStatus.CLOSED:
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return "bg-gray-100 text-gray-800";
      case TicketPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case TicketPriority.HIGH:
        return "bg-orange-100 text-orange-800";
      case TicketPriority.URGENT:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage your support requests and track their progress</p>
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of your issue"
                    value={newTicket.title || ""}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category || TicketCategory.GENERAL_INQUIRY}
                    onValueChange={(value) =>
                      setNewTicket((prev) => ({ ...prev, category: value as TicketCategory }))
                    }
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
                      <SelectItem value={TicketCategory.SUBSCRIPTION_ISSUE}>
                        Subscription Issue
                      </SelectItem>
                      <SelectItem value={TicketCategory.PAYMENT_PROBLEM}>
                        Payment Problem
                      </SelectItem>
                      <SelectItem value={TicketCategory.ACCOUNT_ISSUE}>Account Issue</SelectItem>
                      <SelectItem value={TicketCategory.REFUND_REQUEST}>Refund Request</SelectItem>
                      <SelectItem value={TicketCategory.FEATURE_REQUEST}>
                        Feature Request
                      </SelectItem>
                      <SelectItem value={TicketCategory.BUG_REPORT}>Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe your issue in detail..."
                    rows={4}
                    value={newTicket.description || ""}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket} disabled={creating}>
                    {creating ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                  <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value={TicketCategory.GENERAL_INQUIRY}>General</SelectItem>
                  <SelectItem value={TicketCategory.TECHNICAL_SUPPORT}>Technical</SelectItem>
                  <SelectItem value={TicketCategory.SUBSCRIPTION_ISSUE}>Subscription</SelectItem>
                  <SelectItem value={TicketCategory.PAYMENT_PROBLEM}>Payment</SelectItem>
                  <SelectItem value={TicketCategory.ACCOUNT_ISSUE}>Account</SelectItem>
                  <SelectItem value={TicketCategory.REFUND_REQUEST}>Refund</SelectItem>
                  <SelectItem value={TicketCategory.FEATURE_REQUEST}>Feature Request</SelectItem>
                  <SelectItem value={TicketCategory.BUG_REPORT}>Bug Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-4">
              {tickets.length === 0
                ? "You haven't created any support tickets yet."
                : "No tickets match your current search or filters."}
            </p>
            {tickets.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Ticket</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {ticket.ticketNumber}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm text-gray-600 capitalize">
                          {ticket.status.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toLowerCase()}
                      </Badge>
                      <Badge variant="outline">
                        {ticket.category.replace("_", " ").toLowerCase()}
                      </Badge>
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Assigned to {ticket.assignedTo.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
