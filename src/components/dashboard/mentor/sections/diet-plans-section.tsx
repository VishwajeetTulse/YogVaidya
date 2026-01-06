"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DietPlanEditor } from "@/components/dynamic-imports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Save, Send, Eye, Trash2, FileText } from "lucide-react";
import { getMentorStudentsData } from "@/lib/server/mentor-students-server";
import type { EditorContent } from "@/lib/types/utils";
import type { JSONContent } from "@tiptap/core";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";

// Validation schema
const dietPlanSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  sessionId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  content: z.custom<JSONContent>(), // TipTap JSON
  tags: z.string().optional(), // Comma-separated tags
  isDraft: z.boolean().optional(),
});

type DietPlanFormData = z.infer<typeof dietPlanSchema>;

interface Student {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: "BLOOM" | "FLOURISH";
  subscriptionStartDate: Date | null;
  createdAt: Date;
}

interface Session {
  id: string;
  scheduledAt: Date;
  sessionType: string;
}

interface DietPlan {
  id: string;
  title: string;
  description?: string;
  student: {
    name: string;
    email: string;
  };
  isDraft: boolean;
  createdAt: Date;
}

import { type MentorSectionProps } from "../types";

export function DietPlansSection({ userDetails }: MentorSectionProps) {
  const mentorId = userDetails.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editorContent, setEditorContent] = useState<EditorContent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [existingPlans, setExistingPlans] = useState<DietPlan[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const form = useForm<DietPlanFormData>({
    resolver: zodResolver(dietPlanSchema),
    defaultValues: {
      studentId: "",
      sessionId: "",
      title: "",
      description: "",
      tags: "",
      isDraft: false,
    },
  });

  // Fetch students and existing plans
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch students using the server-side function
        const studentsData = await getMentorStudentsData();
        if (studentsData.success && studentsData.data) {
          // Filter only FLOURISH subscribers (DIETPLANNER mentors work with FLOURISH students)
          const flourishStudents = studentsData.data.students.filter(
            (s) => s.subscriptionPlan === "FLOURISH"
          );
          setStudents(flourishStudents);
        } else {
          console.error("❌ Failed to fetch students:", studentsData.error);
          toast.error("Failed to load students");
        }

        // Fetch existing diet plans
        const plansRes = await fetch(`/api/mentor/diet-plans?mentorId=${mentorId}`);
        if (plansRes.ok) {
          const data = await plansRes.json();
          setExistingPlans(data.dietPlans || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [mentorId]);

  // Fetch sessions when student is selected
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedStudentId) {
        setSessions([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/mentor/sessions?mentorId=${mentorId}&studentId=${selectedStudentId}&type=DIET`
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, [selectedStudentId, mentorId]);

  const onSubmit = async (isDraft: boolean) => {
    const formData = form.getValues();

    // Validation
    if (!formData.studentId) {
      toast.error("Please select a student");
      return;
    }
    if (!formData.title || formData.title.length < 3) {
      toast.error("Please enter a title (minimum 3 characters)");
      return;
    }
    if (!editorContent) {
      toast.error("Please add some content to the diet plan");
      return;
    }

    setIsLoading(true);

    try {
      // Parse tags
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : [];

      const response = await fetch("/api/mentor/diet-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formData.studentId,
          sessionId: formData.sessionId || null,
          title: formData.title,
          description: formData.description || "",
          content: editorContent,
          tags: tagsArray,
          isDraft,
          mentorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save diet plan");
      }

      const _result = await response.json();

      toast.success(isDraft ? "Draft saved successfully!" : "Diet plan sent to student!");

      // Reset form
      form.reset();
      setEditorContent(null);
      setSelectedStudentId("");

      // Refresh existing plans
      const plansRes = await fetch(`/api/mentor/diet-plans?mentorId=${mentorId}`);
      if (plansRes.ok) {
        const data = await plansRes.json();
        setExistingPlans(data.dietPlans || []);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save diet plan";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    toast.warning("Are you sure you want to delete this diet plan?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch(`/api/mentor/diet-plans/${planId}`, {
              method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            toast.success("Diet plan deleted");
            setExistingPlans((prev) => prev.filter((p) => p.id !== planId));
          } catch (error) {
            toast.error("Failed to delete diet plan");
            console.error(error);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  if (isLoadingData) {
    return <DashboardSkeleton />;
  }

  // Check if mentor is a DIETPLANNER
  const isDietPlanner = userDetails.mentorType === "DIETPLANNER";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diet Plans</h1>
        <p className="text-gray-600 mt-2">Create and manage diet plans for your students.</p>
      </div>

      {/* Create New Diet Plan - Only for DIETPLANNER */}
      {!isDietPlanner ? (
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diet Plan Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Diet Planning Feature Unavailable
              </h3>
              <p className="text-gray-600 mb-4">
                This feature is exclusively available for <strong>Diet Planner</strong> mentors.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Your Role:</strong>{" "}
                  {userDetails.mentorType === "YOGAMENTOR"
                    ? "Yoga Mentor"
                    : userDetails.mentorType === "MEDITATIONMENTOR"
                      ? "Meditation Mentor"
                      : "Mentor"}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  To access diet planning features, your account needs to be designated as a Diet
                  Planner.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Diet Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No students with FLOURISH subscription found.</p>
                <p className="text-sm mt-2">
                  Diet plans are only available for FLOURISH subscribers.
                </p>
              </div>
            ) : (
              <form className="space-y-6">
                {/* Student Selection */}
                <div>
                  <Label htmlFor="studentId">Select Student *</Label>
                  <select
                    id="studentId"
                    {...form.register("studentId")}
                    onChange={(e) => {
                      form.setValue("studentId", e.target.value);
                      setSelectedStudentId(e.target.value);
                    }}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="">Choose a student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.studentId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.studentId.message}
                    </p>
                  )}
                </div>

                {/* Session Selection (Optional) */}
                {selectedStudentId && sessions.length > 0 && (
                  <div>
                    <Label htmlFor="sessionId">Link to Session (Optional)</Label>
                    <select
                      id="sessionId"
                      {...form.register("sessionId")}
                      className="w-full border rounded-md p-2 mt-1"
                    >
                      <option value="">No session (standalone plan)</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {new Date(session.scheduledAt).toLocaleString()} - {session.sessionType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div>
                  <Label htmlFor="title">Plan Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., 7-Day Weight Loss Plan"
                    {...form.register("title")}
                    className="mt-1"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Brief Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Quick summary of the plan..."
                    {...form.register("description")}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., weight-loss, vegetarian, 1800-cal (comma-separated)"
                    {...form.register("tags")}
                    className="mt-1"
                  />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <Label>Diet Plan Content *</Label>
                  <div className="mt-1">
                    <DietPlanEditor
                      content={editorContent ?? undefined}
                      onChange={setEditorContent}
                      placeholder="Start typing your diet plan... Use the toolbar to format text, add tables, and insert images."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSubmit(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save as Draft
                  </Button>

                  <Button type="button" onClick={() => onSubmit(false)} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send to Student
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Diet Plans */}
      {existingPlans.length > 0 && (
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your Diet Plans ({existingPlans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border-none rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {plan.title}
                      {plan.isDraft && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      For: {plan.student.name} • Created:{" "}
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/dashboard/diet-plan/${plan.id}`, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
