"use client";

import React, { useState, useEffect, useCallback } from "react";
import { type AdminSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { type LogEntry } from "@/app/api/admin/logs/route";

import { Database, Filter, RefreshCw, User, AlertCircle, Info, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LogsExportSection from "./logs-export-section";

// Type for ticket metadata
interface TicketMetadata {
  ticketNumber?: string;
  oldStatus?: string;
  newStatus?: string;
  assignedToName?: string;
}

export const LogsSection: React.FC<AdminSectionProps> = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [category, setCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Available filter options - Updated to match actual categories in use
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "AUTHENTICATION", label: "Authentication" },
    { value: "SYSTEM", label: "System" },
    { value: "USER", label: "User Management" },
    { value: "MENTOR", label: "Mentor Management" },
    { value: "ADMIN", label: "Admin Actions" },
    { value: "MODERATOR", label: "Moderator Actions" },
    { value: "TICKET", label: "Ticket Activities" },
    { value: "SUBSCRIPTION", label: "Subscriptions" },
    { value: "PAYMENT", label: "Payments" },
  ];
  const levelOptions = [
    { value: "all", label: "All Levels" },
    { value: "INFO", label: "Info" },
    { value: "WARNING", label: "Warning" },
    { value: "ERROR", label: "Error" },
  ];

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("pageSize", pagination.pageSize.toString());

      if (category && category !== "all") params.append("category", category);
      if (level && level !== "all") params.append("level", level);
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/admin/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, category, level, userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, pagination.page, category, level, userId]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleResetFilters = () => {
    setCategory("");
    setLevel("");
    setUserId("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getLevelBadge = (logLevel: string) => {
    switch (logLevel) {
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle size={14} />
            Error
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <AlertTriangle size={14} />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Info size={14} />
            Info
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">System Logs</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main logs card - takes up 2/3 of the space on large screens */}
        <Card className="p-4 lg:col-span-3">
          <div className="text-sm text-muted-foreground mb-4">
            View and filter system logs and user activities including ticket operations. Monitor
            authentication events, system operations, user actions, and complete ticket audit trail.
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-[200px]"
                />
                <Button variant="ghost" onClick={() => setUserId("")}>
                  Clear
                </Button>
              </div>
            </div>

            <Button
              variant="secondary"
              className="flex items-center gap-2 ml-auto"
              onClick={handleResetFilters}
            >
              <Filter size={16} />
              Reset Filters
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Log table */}
          {error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 my-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-medium">Error:</span> {error}
              </div>
            </div>
          ) : (
            <Table>
              <TableCaption>
                Showing {logs.length} of {pagination.total} logs
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="w-[120px]">User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Extra Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw size={24} className="animate-spin mb-2" />
                        <span>Loading logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <Database size={24} className="mb-2 text-muted-foreground" />
                        <span>No logs found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.category === "TICKET" && (
                            <Badge variant="secondary" className="text-xs">
                              🎫
                            </Badge>
                          )}
                          <span>{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.category === "TICKET"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : ""
                          }
                        >
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell>
                        {log.userId ? (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span className="font-mono text-xs truncate">{log.userId}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.details}</TableCell>
                      <TableCell className="max-w-xs">
                        {log.category === "TICKET" && log.metadata ? (
                          <div className="space-y-1 text-xs text-gray-600">
                            {(log.metadata as TicketMetadata).ticketNumber && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">Ticket:</span>
                                <Badge variant="outline" className="text-xs">
                                  {(log.metadata as TicketMetadata).ticketNumber}
                                </Badge>
                              </div>
                            )}
                            {(log.metadata as TicketMetadata).oldStatus &&
                              (log.metadata as TicketMetadata).newStatus && (
                                <div className="text-xs">
                                  <span className="font-semibold">Status:</span>{" "}
                                  {(log.metadata as TicketMetadata).oldStatus} →{" "}
                                  {(log.metadata as TicketMetadata).newStatus}
                                </div>
                              )}
                            {(log.metadata as TicketMetadata).assignedToName && (
                              <div className="text-xs">
                                <span className="font-semibold">Assigned to:</span>{" "}
                                {(log.metadata as TicketMetadata).assignedToName}
                              </div>
                            )}
                          </div>
                        ) : log.ipAddress ? (
                          <div className="text-xs text-gray-500">IP: {log.ipAddress}</div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
              >
                Next
              </Button>
            </div>{" "}
          </div>
        </Card>

        {/* Log export and management options */}
      </div>
      <LogsExportSection />
    </div>
  );
};
