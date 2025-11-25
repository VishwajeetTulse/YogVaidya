"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, IndianRupee } from "lucide-react";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const pricingSchema = z.object({
  sessionPrice: z.coerce
    .number()
    .min(0, "Price must be at least 0")
    .max(10000, "Price must be less than 10,000"),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface PricingData {
  sessionPrice: number | null;
}

export default function PricingSection() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [_pricingData, setPricingData] = useState<PricingData | null>(null);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      sessionPrice: 0,
    },
  });

  // Load current pricing data
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await fetch("/api/mentor/pricing");
        const result = await response.json();

        if (result.success) {
          const data = result.data;
          setPricingData(data);
          form.reset({
            sessionPrice: data.sessionPrice || 0,
          });
        } else {
          console.error("Failed to load pricing:", result.error);
        }
      } catch (error) {
        console.error("Error loading pricing:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, [form]);

  const onSubmit = async (data: PricingFormData) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/mentor/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionPrice: data.sessionPrice,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPricingData(result.data);
        toast.success("Pricing updated successfully!");
      } else {
        toast.error(result.error || "Failed to update pricing");
      }
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast.error("Failed to update pricing");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const sessionPrice = form.watch("sessionPrice");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Session Pricing</h1>
        <p className="text-gray-600 mt-2">Set your pricing for one-on-one sessions.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>Set your pricing for one-on-one sessions with students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="sessionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="10000"
                          step="50"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set your price in Indian Rupees (₹) per session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pricing Preview */}
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Pricing Preview</h4>
                <div className="text-2xl font-bold text-primary">
                  ₹{sessionPrice || 0} per session
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Students will be charged a fixed amount per session regardless of duration
                </p>
              </div>

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Pricing...
                  </>
                ) : (
                  "Update Pricing"
                )}
              </Button>
            </form>
          </Form>

          {/* Additional Information */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Note:</strong> Your pricing will be visible to students when they book
              sessions with you.
            </p>
            <p>You can update your pricing anytime. Changes will apply to new bookings only.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
