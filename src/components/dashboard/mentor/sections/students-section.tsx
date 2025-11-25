import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";
import { getStudents } from "@/lib/students";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getMentorType } from "@/lib/mentor-type";
import { useSession } from "@/lib/auth-client";
import { type User } from "@prisma/client";

export const StudentsSection = () => {
  const [students, setstudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const mentortype = await getMentorType(session?.user || { email: "" });
        const studentsData = await getStudents(mentortype);

        setstudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to load students. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [session]);
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-800">Error Loading Students</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-10">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">No Students Found</h2>
        <p className="text-gray-500 mt-2">
          Start by inviting students to join your mentorship program.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-2">Connect with and track your students&apos; progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card
            key={student.id}
            className="p-6 border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-xl">
                  {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                </span>
              </div>
              <h3 className="font-semibold text-lg">{student.name ?? "Unknown"}</h3>
              <p className="text-gray-500 text-sm">
                Joined on{" "}
                {student.subscriptionStartDate
                  ? new Date(student.subscriptionStartDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                <span className="text-purple-600 font-medium">
                  Subscription Plan : {student.subscriptionPlan}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
