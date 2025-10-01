"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DietPlanViewer } from "@/components/dashboard/user/DietPlanViewer";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  User, 
  FileText,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

interface DietPlan {
  id: string;
  title: string;
  description: string | null;
  content: any;
  tags: string | string[] | null;
  isDraft: boolean;
  createdAt: Date;
  student: {
    id: string;
    name: string;
    email: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DietPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchDietPlan();
  }, [planId]);

  const fetchDietPlan = async () => {
    try {
      console.log("🔍 Fetching diet plan:", planId);
      const response = await fetch(`/api/diet-plans/${planId}`);
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch diet plan");
      }
      
      const data = await response.json();
      console.log("✅ Diet plan data:", data);
      setDietPlan(data.dietPlan);
    } catch (error) {
      console.error("Error fetching diet plan:", error);
      toast.error("Failed to load diet plan");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsPDF = async () => {
    try {
      setIsDownloading(true);
      
      // Open the download URL in a new window
      // The HTML will auto-trigger print dialog
      const printWindow = window.open(
        `/api/diet-plans/${planId}/download`,
        '_blank',
        'width=800,height=600'
      );
      
      if (!printWindow) {
        toast.error("Please allow pop-ups to download diet plan");
        return;
      }

      toast.success("Opening print dialog...");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download diet plan");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Diet Plan Not Found</h2>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle tags - could be string or already parsed
  const tags = dietPlan.tags 
    ? (typeof dietPlan.tags === 'string' 
        ? dietPlan.tags.split(',').map(t => t.trim()) 
        : Array.isArray(dietPlan.tags) 
          ? dietPlan.tags 
          : [])
    : [];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button 
          onClick={downloadAsPDF}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
      </div>

      {/* Diet Plan Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{dietPlan.title}</CardTitle>
              {dietPlan.description && (
                <p className="text-muted-foreground mt-2">
                  {dietPlan.description}
                </p>
              )}
            </div>
            {dietPlan.isDraft && (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Mentor: {dietPlan.mentor.name}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Student: {dietPlan.student.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(dietPlan.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Diet Plan Content */}
      <DietPlanViewer
        title={dietPlan.title}
        description={dietPlan.description || undefined}
        content={dietPlan.content}
        createdAt={dietPlan.createdAt}
        mentorName={dietPlan.mentor.name}
        tags={tags}
      />
    </div>
  );
}
