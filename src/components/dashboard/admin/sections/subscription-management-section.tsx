"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, 
  Filter, 
  Edit, 
  Clock, 
  RefreshCw, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Star,
  Gem
} from "lucide-react";

interface UserSubscription {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  billingPeriod: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  trialUsed: boolean;
  isTrialActive: boolean;
  trialEndDate: string | null;
  paymentAmount: number | null;
  autoRenewal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalTrialUsers: number;
  monthlyRevenue: number;
  recentActivity: Array<{
    user: string;
    action: string;
    timestamp: string;
  }>;
  planBreakdown: Record<string, Record<string, number>>;
  growthRate?: number;
  growthDirection?: 'up' | 'down' | 'neutral';
  isFirstMonth?: boolean;
}

export default function SubscriptionManagementSection() {
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExtendTrialDialogOpen, setIsExtendTrialDialogOpen] = useState(false);
  
  // Form data for editing
  const [editFormData, setEditFormData] = useState({
    subscriptionPlan: "",
    subscriptionStatus: "",
    billingPeriod: "",
    autoRenewal: false,
    extendDays: 7
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, statusFilter, planFilter, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/subscriptions');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.users || []);
      } else {
        toast.error("Failed to load user subscriptions");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Error loading user data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setGrowthLoading(true);
      
      // Fetch both subscription stats and growth stats in parallel
      const [statsResponse, growthResponse] = await Promise.all([
        fetch('/api/admin/subscription-stats'),
        fetch('/api/admin/growth-stats')
      ]);
      
      const statsResult = await statsResponse.json();
      const growthResult = await growthResponse.json();
      
      if (statsResult.success) {
        let combinedStats = statsResult.stats;
        
        // Add growth data if available
        if (growthResult.success) {
          combinedStats = {
            ...combinedStats,
            growthRate: growthResult.growthStats.growthRate,
            growthDirection: growthResult.growthStats.growthDirection,
            isFirstMonth: growthResult.growthStats.isFirstMonth
          };
        }
        
        setStats(combinedStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setGrowthLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.phone?.includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "trial") {
        filtered = filtered.filter(user => user.isTrialActive);
      } else if (statusFilter === "expired_trial") {
        filtered = filtered.filter(user => user.trialUsed && !user.isTrialActive && !user.subscriptionPlan);
      } else {
        filtered = filtered.filter(user => user.subscriptionStatus === statusFilter);
      }
    }
    
    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(user => user.subscriptionPlan === planFilter);
    }
    
    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: UserSubscription) => {
    setSelectedUser(user);
    setEditFormData({
      subscriptionPlan: user.subscriptionPlan || "NONE",
      subscriptionStatus: user.subscriptionStatus || "INACTIVE",
      billingPeriod: user.billingPeriod || "monthly",
      autoRenewal: user.autoRenewal,
      extendDays: 7
    });
    setIsEditDialogOpen(true);
  };

  const handleExtendTrial = (user: UserSubscription) => {
    setSelectedUser(user);
    setEditFormData(prev => ({ ...prev, extendDays: 7 }));
    setIsExtendTrialDialogOpen(true);
  };

  const submitEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Convert "NONE" back to null for the API
      const formDataToSubmit = {
        ...editFormData,
        subscriptionPlan: editFormData.subscriptionPlan === "NONE" ? null : editFormData.subscriptionPlan
      };
      
      const response = await fetch('/api/admin/users/subscription-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...formDataToSubmit
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("User subscription updated successfully");
        setIsEditDialogOpen(false);
        fetchUsers(); // Refresh data
      } else {
        toast.error(result.error || "Failed to update subscription");
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error("Error updating subscription");
    }
  };

  const submitExtendTrial = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch('/api/admin/users/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          extendDays: editFormData.extendDays
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Trial extended by ${editFormData.extendDays} days`);
        setIsExtendTrialDialogOpen(false);
        fetchUsers(); // Refresh data
      } else {
        toast.error(result.error || "Failed to extend trial");
      }
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error("Error extending trial");
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/export/subscriptions');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded successfully");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export data");
    }
  };

  const getStatusBadge = (user: UserSubscription) => {
    if (user.isTrialActive) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Trial Active</Badge>;
    }
    if (user.trialUsed && !user.subscriptionPlan) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    
    switch (user.subscriptionStatus) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case "ACTIVE_UNTIL_END":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Ending</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">No Subscription</Badge>;
    }
  };

  const getPlanIcon = (plan: string | null) => {
    switch (plan) {
      case "SEED":
        return <Star className="w-4 h-4 text-green-600" />;
      case "BLOOM":
        return <Crown className="w-4 h-4 text-blue-600" />;
      case "FLOURISH":
        return <Gem className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatGrowthRate = (growthRate?: number, growthDirection?: 'up' | 'down' | 'neutral', isFirstMonth?: boolean) => {
    if (isFirstMonth) {
      return "New Business";
    }
    
    if (growthRate === undefined || growthRate === null) {
      return "N/A";
    }
    
    const sign = growthDirection === 'up' ? '+' : growthDirection === 'down' ? '' : '';
    return `${sign}${Math.abs(growthRate).toFixed(1)}%`;
  };

  const getGrowthColor = (growthDirection?: 'up' | 'down' | 'neutral', isFirstMonth?: boolean) => {
    if (isFirstMonth) return "text-blue-600";
    
    switch (growthDirection) {
      case 'up': return "text-green-600";
      case 'down': return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#876aff] to-[#76d2fa] bg-clip-text text-transparent">
            Subscription Management
          </h1>
          <p className="text-gray-600">Manage user subscriptions, trials, and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalActiveSubscriptions}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trial Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalTrialUsers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  {growthLoading ? (
                    <div className="text-2xl font-bold text-gray-400">Loading...</div>
                  ) : (
                    <p className={`text-2xl font-bold ${getGrowthColor(stats?.growthDirection, stats?.isFirstMonth)}`}>
                      {formatGrowthRate(stats?.growthRate, stats?.growthDirection, stats?.isFirstMonth)}
                    </p>
                  )}
                  {stats?.isFirstMonth && (
                    <p className="text-xs text-blue-500 mt-1">First month tracking</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${
                  stats?.isFirstMonth 
                    ? "bg-blue-100" 
                    : stats?.growthDirection === 'up' 
                    ? "bg-green-100" 
                    : stats?.growthDirection === 'down' 
                    ? "bg-red-100" 
                    : "bg-gray-100"
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    stats?.isFirstMonth 
                      ? "text-blue-600" 
                      : stats?.growthDirection === 'up' 
                      ? "text-green-600" 
                      : stats?.growthDirection === 'down' 
                      ? "text-red-600" 
                      : "text-gray-600"
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="trial">Trial Active</SelectItem>
                <SelectItem value="expired_trial">Trial Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="SEED">Seed</SelectItem>
                <SelectItem value="BLOOM">Bloom</SelectItem>
                <SelectItem value="FLOURISH">Flourish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user subscriptions and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" || planFilter !== "all"
                  ? "No users match your filters."
                  : "No users found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 p-4 bg-gray-50 border-b font-medium text-xs uppercase text-gray-500 rounded-t-lg">
                  <div>User</div>
                  <div>Plan</div>
                  <div>Status</div>
                  <div>Billing</div>
                  <div>Started</div>
                  <div>Expires</div>
                  <div>Revenue</div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="grid grid-cols-8 gap-4 p-4 hover:bg-gray-50 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.name || "N/A"}</div>
                        <div className="text-gray-500 truncate">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getPlanIcon(user.subscriptionPlan)}
                        <span className="font-medium">
                          {user.subscriptionPlan || "None"}
                        </span>
                      </div>
                      
                      <div>
                        {getStatusBadge(user)}
                      </div>
                      
                      <div>
                        <div className="font-medium">
                          {user.billingPeriod ? 
                            user.billingPeriod.charAt(0).toUpperCase() + user.billingPeriod.slice(1) 
                            : "N/A"
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.autoRenewal ? "Auto-renew" : "Manual"}
                        </div>
                      </div>
                      
                      <div>
                        {formatDate(user.subscriptionStartDate)}
                      </div>
                      
                      <div>
                        {user.isTrialActive ? (
                          <span className="text-blue-600 font-medium">
                            {formatDate(user.trialEndDate)}
                          </span>
                        ) : (
                          formatDate(user.subscriptionEndDate)
                        )}
                      </div>
                      
                      <div className="font-medium">
                        {formatCurrency(user.paymentAmount)}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {(user.isTrialActive || user.trialUsed) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExtendTrial(user)}
                          >
                            <Clock className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select
                  value={editFormData.subscriptionPlan}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, subscriptionPlan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Plan</SelectItem>
                    <SelectItem value="SEED">Seed</SelectItem>
                    <SelectItem value="BLOOM">Bloom</SelectItem>
                    <SelectItem value="FLOURISH">Flourish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editFormData.subscriptionStatus}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, subscriptionStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ACTIVE_UNTIL_END">Active Until End</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="billing">Billing Period</Label>
              <Select
                value={editFormData.billingPeriod}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, billingPeriod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={isExtendTrialDialogOpen} onOpenChange={setIsExtendTrialDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Extend trial period for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extendDays">Extend by (days)</Label>
              <Select
                value={editFormData.extendDays.toString()}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, extendDays: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendTrialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExtendTrial}>
              Extend Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
