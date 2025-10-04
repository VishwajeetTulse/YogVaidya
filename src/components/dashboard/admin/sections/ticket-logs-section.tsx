"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  Filter,
  Info,
  RefreshCw,
  Search,
  User,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  UserPlus,
  Edit,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TicketLog {
  id: string;
  timestamp: string;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  action: string;
  category: string;
  details: string;
  level: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
}

interface TicketLogStats {
  totalLogs: number;
  timeframe: string;
  summary: {
    totalActions: number;
    byAction: Record<string, number>;
    byLevel: Record<string, number>;
    byUser: Record<string, { name: string; count: number; role: string }>;
    recentActivity: TicketLog[];
  };
}

export default function TicketLogsSection() {
  const [logs, setLogs] = useState<TicketLog[]>([]);
  const [stats, setStats] = useState<TicketLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("day");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [ticketIdFilter, setTicketIdFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);

  // Fetch ticket logs
  const fetchTicketLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeframe,
        limit: limit.toString(),
      });

      if (actionFilter !== "all") params.append("action", actionFilter);
      if (levelFilter !== "all") params.append("level", levelFilter);
      if (ticketIdFilter.trim()) params.append("ticketId", ticketIdFilter.trim());

      const response = await fetch(`/api/admin/ticket-logs?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch ticket logs");
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Error fetching ticket logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
      setLogs([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketLogs();
  }, [timeframe, actionFilter, levelFilter, ticketIdFilter, limit]);

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.details.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email.toLowerCase().includes(searchLower) ||
      (log.metadata?.ticketNumber && log.metadata.ticketNumber.toLowerCase().includes(searchLower))
    );
  });

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action.includes("CREATED")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("STATUS_CHANGED")) return <Edit className="h-4 w-4 text-blue-500" />;
    if (action.includes("ASSIGNED")) return <UserPlus className="h-4 w-4 text-purple-500" />;
    if (action.includes("UNASSIGNED")) return <User className="h-4 w-4 text-orange-500" />;
    if (action.includes("DELETED")) return <Trash2 className="h-4 w-4 text-red-500" />;
    if (action.includes("VIEWED")) return <Eye className="h-4 w-4 text-gray-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  // Get level badge
  const getLevelBadge = (level: string) => {
    const config = {
      INFO: { color: "bg-blue-100 text-blue-800", icon: Info },
      WARNING: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      ERROR: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };

    const { color, icon: Icon } = config[level as keyof typeof config] || config.INFO;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {level}
      </Badge>
    );
  };

  // Export logs to CSV
  const exportLogs = () => {
    const csvHeaders = ["Timestamp", "User", "Action", "Level", "Details", "Ticket", "IP Address"];
    const csvData = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.user ? `${log.user.name || "Unknown"} (${log.user.email})` : "System",
      log.action,
      log.level,
      log.details,
      log.metadata?.ticketNumber || "-",
      log.ipAddress || "-",
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ticket-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("Logs exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket System Logs</h2>
          <p className="text-gray-600">Monitor all ticket-related activities and system events</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTicketLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Actions</p>
                  <p className="text-xl font-semibold">{stats.summary.totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-xl font-semibold">
                    {Object.keys(stats.summary.byUser).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-xl font-semibold">{stats.summary.byLevel["WARNING"] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-xl font-semibold">{stats.summary.byLevel["ERROR"] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select
                    value={timeframe}
                    onValueChange={(value: "day" | "week" | "month") => setTimeframe(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Last 24 Hours</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action">Action Type</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="TICKET_CREATED">Created</SelectItem>
                      <SelectItem value="TICKET_STATUS_CHANGED">Status Changed</SelectItem>
                      <SelectItem value="TICKET_ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="TICKET_UNASSIGNED">Unassigned</SelectItem>
                      <SelectItem value="TICKETS_BULK_DELETED">Bulk Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">Log Level</Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ticketId">Ticket ID</Label>
                  <Input
                    id="ticketId"
                    placeholder="Enter ticket ID..."
                    value={ticketIdFilter}
                    onChange={(e) => setTicketIdFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="search">Search Logs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by details, action, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Activity Log ({filteredLogs.length} entries)</CardTitle>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => setLimit(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 entries</SelectItem>
                    <SelectItem value="50">50 entries</SelectItem>
                    <SelectItem value="100">100 entries</SelectItem>
                    <SelectItem value="200">200 entries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading logs...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  {error}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-6 w-6 mx-auto mb-2" />
                  No logs found matching your criteria
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0 mt-1">{getActionIcon(log.action)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {log.action.replace("TICKET_", "").replace("_", " ")}
                            </span>
                            {getLevelBadge(log.level)}
                            {log.metadata?.ticketNumber && (
                              <Badge variant="outline" className="text-xs">
                                {log.metadata.ticketNumber}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">{log.details}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </div>
                            {log.user && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user.name || "Unknown"} ({log.user.role})
                              </div>
                            )}
                            {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actions Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.summary.byAction).map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {action.replace("TICKET_", "").replace("_", " ")}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.summary.byUser)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .slice(0, 10)
                      .map(([userId, userData]) => (
                        <div key={userId} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium">{userData.name}</span>
                            <Badge className="ml-2 text-xs" variant="outline">
                              {userData.role}
                            </Badge>
                          </div>
                          <Badge variant="outline">{userData.count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
