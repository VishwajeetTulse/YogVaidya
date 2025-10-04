"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Clock,
  RefreshCw,
  Users,
  DollarSign,
  Star,
  Crown,
  Gem,
  Eye,
  TrendingUp,
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
}

interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalTrialUsers: number;
  monthlyRevenue: number;
  planBreakdown: Record<string, Record<string, number>>;
}

export default function SubscriptionSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isExtendTrialDialogOpen, setIsExtendTrialDialogOpen] = useState(false);

  // Form data
  const [extendDays, setExtendDays] = useState(7);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/moderator/subscription-stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/moderator/user-lookup?email=${encodeURIComponent(searchTerm.trim())}`
      );
      const result = await response.json();

      if (result.success) {
        setSearchResult(result.user);
        if (!result.user) {
          toast.info("User not found");
        }
      } else {
        toast.error(result.error || "Failed to search user");
      }
    } catch (error) {
      console.error("Error searching user:", error);
      toast.error("Error searching user");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user: UserSubscription) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleExtendTrial = (user: UserSubscription) => {
    setSelectedUser(user);
    setExtendDays(7);
    setIsExtendTrialDialogOpen(true);
  };

  const submitExtendTrial = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch("/api/moderator/extend-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          extendDays: extendDays,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Trial extended by ${extendDays} days`);
        setIsExtendTrialDialogOpen(false);
        // Refresh search result if it's the same user
        if (searchResult?.id === selectedUser.id) {
          await searchUser();
        }
        fetchStats(); // Refresh stats
      } else {
        toast.error(result.error || "Failed to extend trial");
      }
    } catch (error) {
      console.error("Error extending trial:", error);
      toast.error("Error extending trial");
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
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchUser();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#876aff] to-[#76d2fa] bg-clip-text text-transparent">
            Subscriptions
          </h1>
          <p className="text-gray-600">View subscription details and provide support</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={statsLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Platform Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalActiveSubscriptions}
                    </p>
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
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(stats.monthlyRevenue)}
                    </p>
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
                    <p className="text-sm font-medium text-gray-600">Platform Health</p>
                    <p className="text-2xl font-bold text-green-600">Good</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* User Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>User Lookup</CardTitle>
          <CardDescription>Search for a user to view their subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter user email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={searchUser} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{searchResult.name || "N/A"}</h3>
                  <p className="text-gray-600">{searchResult.email}</p>
                  {searchResult.phone && (
                    <p className="text-sm text-gray-500">{searchResult.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(searchResult)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {(searchResult.isTrialActive || searchResult.trialUsed) && (
                    <Button size="sm" onClick={() => handleExtendTrial(searchResult)}>
                      <Clock className="w-4 h-4 mr-2" />
                      Extend Trial
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPlanIcon(searchResult.subscriptionPlan)}
                    <span className="font-medium">{searchResult.subscriptionPlan || "None"}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(searchResult)}</div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Expires</p>
                  <p className="mt-1 font-medium">
                    {searchResult.isTrialActive
                      ? formatDate(searchResult.trialEndDate)
                      : formatDate(searchResult.subscriptionEndDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="mt-1 font-medium">{formatCurrency(searchResult.paymentAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="border rounded-lg p-6">
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Support Guidelines</CardTitle>
          <CardDescription>Quick reference for subscription support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✅ You Can Do</h4>
              <ul className="space-y-2 text-sm">
                <li>• View user subscription details</li>
                <li>• Extend trial periods (up to 30 days)</li>
                <li>• Check payment history</li>
                <li>• Verify subscription status</li>
                <li>• Provide billing support information</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-red-700">❌ Admin Only</h4>
              <ul className="space-y-2 text-sm">
                <li>• Modify subscription plans</li>
                <li>• Process refunds</li>
                <li>• Change billing amounts</li>
                <li>• Cancel subscriptions</li>
                <li>• Access payment gateway data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Subscription Details</DialogTitle>
            <DialogDescription>
              Complete subscription information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid gap-6 py-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="mt-1">{selectedUser.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="mt-1">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                  <p className="mt-1">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Subscription Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPlanIcon(selectedUser.subscriptionPlan)}
                      <span>{selectedUser.subscriptionPlan || "None"}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Billing Period</Label>
                    <p className="mt-1">{selectedUser.billingPeriod || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Auto Renewal</Label>
                    <p className="mt-1">{selectedUser.autoRenewal ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Started</Label>
                    <p className="mt-1">{formatDate(selectedUser.subscriptionStartDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expires</Label>
                    <p className="mt-1">{formatDate(selectedUser.subscriptionEndDate)}</p>
                  </div>
                </div>
              </div>

              {/* Trial Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Trial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Trial Used</Label>
                    <p className="mt-1">{selectedUser.trialUsed ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Trial Active</Label>
                    <p className="mt-1">{selectedUser.isTrialActive ? "Yes" : "No"}</p>
                  </div>
                  {selectedUser.trialEndDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Trial Ends</Label>
                      <p className="mt-1">{formatDate(selectedUser.trialEndDate)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Revenue</Label>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(selectedUser.paymentAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={isExtendTrialDialogOpen} onOpenChange={setIsExtendTrialDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>Extend trial period for {selectedUser?.email}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extendDays">Extend by (days)</Label>
              <Select
                value={extendDays.toString()}
                onValueChange={(value) => setExtendDays(parseInt(value))}
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will extend the trial period and help the user evaluate
                our services. Use this feature responsibly for genuine support cases.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendTrialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExtendTrial}>Extend Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
