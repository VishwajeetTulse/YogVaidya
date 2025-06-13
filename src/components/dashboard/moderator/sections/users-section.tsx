import { ModeratorSectionProps } from "../types";

export const UsersSection = ({ userDetails }: ModeratorSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      <p className="text-gray-600 mt-2">Manage platform users and their activities.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">User management coming soon...</p>
    </div>
  </div>
);

export const AnalyticsSection = ({ userDetails }: ModeratorSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      <p className="text-gray-600 mt-2">Platform insights and performance metrics.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Analytics dashboard coming soon...</p>
    </div>
  </div>
);

export const SettingsSection = ({ userDetails }: ModeratorSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-600 mt-2">Configure your moderator preferences.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Settings panel coming soon...</p>
    </div>
  </div>
);

export const SupportSection = ({ userDetails }: ModeratorSectionProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
      <p className="text-gray-600 mt-2">Get help and access documentation.</p>
    </div>
    <div className="text-center py-20">
      <p className="text-gray-500">Support center coming soon...</p>
    </div>
  </div>
);
