"use client";

import { AdminSectionProps } from "../types";

export const SystemSection = ({ userDetails }: AdminSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
      <p className="text-gray-600 mt-2">Monitor system performance and health metrics.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">System monitoring coming soon...</p>
    </div>
  </div>
);

export const AnalyticsSection = ({ userDetails }: AdminSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
      <p className="text-gray-600 mt-2">Comprehensive platform insights and performance metrics.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Analytics dashboard coming soon...</p>
    </div>
  </div>
);

export const DatabaseSection = ({ userDetails }: AdminSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
      <p className="text-gray-600 mt-2">Database administration and maintenance tools.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Database management coming soon...</p>
    </div>
  </div>
);

export const SettingsSection = ({ userDetails }: AdminSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
      <p className="text-gray-600 mt-2">Configure system-wide settings and preferences.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">System settings coming soon...</p>
    </div>
  </div>
);

export const SupportSection = ({ userDetails }: AdminSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
      <p className="text-gray-600 mt-2">Admin documentation and support resources.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Support documentation coming soon...</p>
    </div>
  </div>
);

