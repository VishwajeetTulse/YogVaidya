import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
        console.log("Fetching students for mentor type:", mentortype);
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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600 mt-2">Connect with and track your students&apos; progress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="p-6 border border-purple-100">
              <div className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-40 mx-auto mb-3" />
                <Skeleton className="h-4 w-36 mx-auto" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-2">Connect with and track your students&apos; progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card
            key={student.id}
            className="p-6 border border-purple-100 hover:border-purple-200 transition-colors"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-semibold">
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
                <span className="text-[#ff7dac]">
                  Subsription Plan : {student.subscriptionPlan}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
