import { Card } from "@/components/ui/card";
import { Users, UserCheck, Server, TrendingUp, ChevronRight } from "lucide-react";
import { AdminSectionProps } from "../types";

interface OverviewSectionProps extends AdminSectionProps {}

export const OverviewSection = ({ userDetails, setActiveSection }: OverviewSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Admin"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Complete system administration and platform oversight.
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-semibold">2,847</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Mentors</p>
              <p className="text-xl font-semibold">156</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">System Health</p>
              <p className="text-xl font-semibold">99.9%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-xl font-semibold">+23%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div>
              <p className="font-medium text-green-800">Database</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">Online</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div>
              <p className="font-medium text-green-800">API Services</p>
              <p className="text-sm text-green-600">Response time: 120ms</p>
            </div>
            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">Healthy</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("users")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-gray-500">User administration</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("analytics")}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-500">Platform insights</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/5 to-[#a792fb]/5 border border-[#876aff]/30"
          onClick={() => setActiveSection("system")}
        >
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">System Health</p>
              <p className="text-sm text-gray-500">Monitor status</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
};
