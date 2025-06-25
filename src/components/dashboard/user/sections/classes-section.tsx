import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, PlayCircle } from "lucide-react";

export const ClassesSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-2">
          Manage your scheduled and completed yoga sessions.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <button className="pb-2 px-1 border-b-2 border-[#76d2fa] text-[#76d2fa] font-medium">
          Upcoming
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Completed
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-[#876aff]">
          Cancelled
        </button>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Vinyasa Flow - Level 2
                  </h3>
                  <p className="text-gray-500">with Mentor Sarah Johnson</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tomorrow, 7:00 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      60 minutes
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  Reschedule
                </Button>
                <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">
                  Join Class
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
