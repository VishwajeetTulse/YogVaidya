"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Lock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { type SectionProps } from "../types";
import Link from "next/link";
import type { EditorContent } from "@/lib/types/utils";

interface DietPlan {
  id: string;
  title: string;
  description?: string;
  content: EditorContent;
  tags: string[];
  mentor: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

export function DietPlansSection({ userDetails }: SectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  useEffect(() => {
    const fetchDietPlans = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/mentor/diet-plans");

        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            errorData = await response
              .json()
              .catch(() => ({ error: "Failed to parse error response" }));
          } else {
            const text = await response.text();
            console.error("❌ Non-JSON error response:", text);
            errorData = { error: text || `HTTP ${response.status}` };
          }

          console.error("❌ Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch diet plans");
        }

        const data = await response.json();
        setDietPlans(data.dietPlans || []);
      } catch (error) {
        console.error("💥 Error fetching diet plans:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load diet plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDietPlans();
  }, []);

  // Check if user has FLOURISH subscription
  const hasFlourishAccess =
    userDetails.subscriptionPlan === "FLOURISH" && userDetails.subscriptionStatus === "ACTIVE";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // No FLOURISH subscription
  if (!hasFlourishAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Diet Plans - Premium Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Personalized Diet Plans</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get custom diet plans created by expert diet planners. This feature is available
              exclusively for FLOURISH subscribers.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong>Current Plan:</strong> {userDetails.subscriptionPlan || "None"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to FLOURISH to unlock diet planning features
              </p>
            </div>
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade to FLOURISH
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No diet plans yet
  if (dietPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Diet Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">No Diet Plans Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your diet planner will create personalized diet plans for you after your consultation
              sessions.
            </p>
            <p className="text-sm text-muted-foreground">
              Book a session with a diet planning expert to get started!
            </p>
            <Link href="/dashboard?section=explore-mentors">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Explore Diet Planners
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display diet plans
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Diet Plans ({dietPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dietPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg truncate">{plan.title}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p>By: {plan.mentor.name}</p>
                      <p>Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                    </div>

                    {plan.tags && plan.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {plan.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => window.open(`/dashboard/diet-plan/${plan.id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Diet Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
