import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MentorSectionProps } from "../types";

interface StudentsSectionProps extends MentorSectionProps {}

export const StudentsSection = ({ userDetails }: StudentsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-2">
          Connect with and track your students' progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((student) => (
          <Card key={student} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-semibold">AJ</span>
              </div>
              <h3 className="font-semibold text-lg">Alice Johnson</h3>
              <p className="text-gray-500 text-sm">
                Member since Jan 2024
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                <span className="text-[#76d2fa]">12 Sessions</span>
                <span className="text-[#ff7dac]">Level: Beginner</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  Message
                </Button>
                <Button size="sm" className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]">
                  View Progress
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
