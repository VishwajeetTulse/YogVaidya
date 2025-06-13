import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Mail, Phone, Calendar, MapPin, Edit } from "lucide-react";
import { SectionProps } from "../types";

interface ProfileSectionProps extends SectionProps {}

export const ProfileSection = ({ userDetails, formatDate }: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture and Basic Info */}
        <Card className="p-6 lg:col-span-1">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {userDetails?.name || "User Name"}
            </h2>
            <p className="text-gray-500 mb-4">
              {userDetails?.email || "user@example.com"}
            </p>
            <Button className="w-full bg-[#76d2fa] hover:bg-[#5a9be9]">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{userDetails?.name || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{userDetails?.email || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{userDetails?.phone || "Not provided"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{userDetails?.dateOfBirth ? formatDate?.(new Date(userDetails.dateOfBirth)) : "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{userDetails?.location || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate?.(userDetails?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Yoga Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Yoga Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <div className="space-y-2">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="experience"
                    value={level}
                    className="mr-2 text-[#76d2fa]"
                    defaultChecked={level === "Intermediate"}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Yoga Styles
            </label>
            <div className="space-y-2">
              {["Hatha Yoga", "Vinyasa Flow", "Power Yoga", "Yin Yoga", "Meditation"].map((style) => (
                <label key={style} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 text-[#76d2fa]"
                    defaultChecked={["Hatha Yoga", "Meditation"].includes(style)}
                  />
                  {style}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Goals and Objectives */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Goals & Objectives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Improve Flexibility",
            "Build Strength",
            "Reduce Stress",
            "Better Sleep",
            "Weight Management",
            "Spiritual Growth",
            "Pain Relief",
            "Mental Clarity"
          ].map((goal) => (
            <label key={goal} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                className="mr-3 text-[#76d2fa]"
                defaultChecked={["Improve Flexibility", "Reduce Stress", "Better Sleep"].includes(goal)}
              />
              {goal}
            </label>
          ))}
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
