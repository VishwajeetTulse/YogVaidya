"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  ArrowRightLeft,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { syncMentorTypes, getMentorStats } from "@/lib/services/mentor-sync";
import { LucideIcon } from "lucide-react";
interface MentorStats {
  totalMentors: number;
  mentorsWithType: number;
  mentorsWithoutType: number;
  approvedApplications: number;
  yogaMentors: number;
  meditationMentors: number;
  typeConsistency: boolean;
}

export const MentorManagementSection = () => {
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadMentorStats = async () => {
    setLoading(true);
    try {
      const result = await getMentorStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        toast.error("Failed to load mentor statistics");
      }
    } catch (error) {
      console.error("Error loading mentor stats:", error);
      toast.error("Failed to load mentor statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMentorTypes = async () => {
    setSyncing(true);
    try {
      const result = await syncMentorTypes();
      if (result.success) {
        toast.success(result.message);
        // Refresh stats after sync
        await loadMentorStats();
      } else {
        toast.error(result.error || "Failed to sync mentor types");
      }
    } catch (error) {
      console.error("Error syncing mentor types:", error);
      toast.error("Failed to sync mentor types");
    } finally {
      setSyncing(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    description 
  }: { 
    title: string; 
    value: number | string; 
    icon: LucideIcon; 
    color: string; 
    description?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Management</h1>
          <p className="text-gray-600 mt-2">
            Manage mentor data consistency and synchronization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadMentorStats}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Stats
          </Button>
          <Button
            onClick={handleSyncMentorTypes}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRightLeft className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Mentor Types
          </Button>
        </div>
      </div>

      {/* Data Consistency Alert */}
      {stats && !stats.typeConsistency && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-800">Data Inconsistency Detected</h3>
              <p className="text-sm text-orange-700">
                {stats.mentorsWithoutType} mentors are missing mentorType field. Run sync to fix this.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Alert */}
      {stats && stats.typeConsistency && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Data Consistency Good</h3>
              <p className="text-sm text-green-700">
                All mentor records have proper mentorType assignments.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Mentors"
            value={stats.totalMentors}
            icon={Users}
            color="text-blue-600"
            description="Users with MENTOR role"
          />
          <StatCard
            title="Mentors with Type"
            value={stats.mentorsWithType}
            icon={CheckCircle}
            color="text-green-600"
            description="Have mentorType assigned"
          />
          <StatCard
            title="Missing Type"
            value={stats.mentorsWithoutType}
            icon={AlertTriangle}
            color="text-orange-600"
            description="Need sync operation"
          />
          <StatCard
            title="Approved Applications"
            value={stats.approvedApplications}
            icon={Database}
            color="text-purple-600"
            description="Total approved"
          />
        </div>
      )}

      {/* Mentor Type Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Mentor Type Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Yoga Mentors</span>
                <span className="font-medium text-blue-600">{stats.yogaMentors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meditation Mentors</span>
                <span className="font-medium text-purple-600">{stats.meditationMentors}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Typed</span>
                  <span className="font-bold">{stats.mentorsWithType}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Use these tools to maintain data consistency and fix any mentor type mismatches.
              </div>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={loadMentorStats}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Statistics
              </Button>
              
              <Button
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                onClick={handleSyncMentorTypes}
                disabled={syncing}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Sync Mentor Types
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Load Initial Stats */}
      {!stats && !loading && (
        <Card className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mentor Statistics</h3>
          <p className="text-gray-600 mb-4">
            Load mentor statistics to see data consistency and perform sync operations.
          </p>
          <Button onClick={loadMentorStats} disabled={loading}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Load Statistics
          </Button>
        </Card>
      )}
    </div>
  );
};

