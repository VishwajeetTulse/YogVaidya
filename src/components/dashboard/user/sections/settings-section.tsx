import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Volume2,
  Mail,
  Calendar
} from "lucide-react";

export const SettingsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your app preferences and account settings.
        </p>
      </div>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Class Reminders</p>
              <p className="text-sm text-gray-500">Get notified before your scheduled classes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">Mobile app notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="outline" className="border-[#876aff] text-[#876aff]">
              Enable
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Sharing</p>
              <p className="text-sm text-gray-500">Share anonymous usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* App Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          App Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to dark theme</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-gray-500">Choose your preferred language</p>
              </div>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>English</option>
              <option>Hindi</option>
              <option>Sanskrit</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Sound Effects</p>
                <p className="text-sm text-gray-500">Play sounds during sessions</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76d2fa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76d2fa]"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start border-[#876aff] text-[#876aff]">
            <Mail className="w-4 h-4 mr-2" />
            Change Email Address
          </Button>
          <Button variant="outline" className="w-full justify-start border-[#FFCCEA] text-[#ff7dac]">
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50">
            <Calendar className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end">
        <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">
          Save Changes
        </Button>
      </div>
    </div>
  );
};
