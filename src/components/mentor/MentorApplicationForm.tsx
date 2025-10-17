"use client";
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import MentorApplicationSubmission from "./MentorApplicationSubmission";
import { Separator } from "@/components/ui/separator";
import { Select } from "../ui/select";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  createMentorApplicationAction,
  getMentorApplicationsAction,
  deleteMentorApplicationAction,
} from "@/lib/actions/mentor-application-actions";

const formSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  profile: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  experience: z
    .number()
    .min(0, "Experience must be a positive number")
    .max(50, "Maximum 50 years experience"),
  expertise: z.string().min(2, "Please enter your areas of expertise"),
  certifications: z.string().min(2, "Please enter your certifications"),
  pow: z.any().optional(),
  sessionPrice: z.coerce
    .number()
    .min(0, "Price must be at least 0")
    .max(10000, "Price must be less than 10,000")
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms." }),
  }),
  mentorType: z.enum(["YOGAMENTOR", "MEDITATIONMENTOR", "DIETPLANNER"], {
    required_error: "Mentor type is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type MentorApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string | null;
  experience: number;
  expertise: string;
  certifications: string;
  powUrl?: string | null;
  status: string | null;
  mentorType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function MentorApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [existingApplication, setExistingApplication] = useState<MentorApplication | null>(null);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      profile: "",
      experience: 0,
      expertise: "",
      certifications: "",
      pow: undefined,
      sessionPrice: undefined,
      mentorType: undefined,
    },
  });

  // Helper function to convert database application to form application
  const convertDatabaseToForm = (dbApp: Record<string, unknown>): MentorApplication =>
    ({
      ...dbApp,
      experience:
        typeof dbApp.experience === "string"
          ? parseInt(dbApp.experience, 10) || 0
          : (dbApp.experience as number) || 0,
    }) as MentorApplication;

  React.useEffect(() => {
    async function fetchApplication() {
      setFetching(true);
      try {
        // Get user session to extract email
        const session = await authClient.getSession();
        const userEmail = session && "data" in session && session.data?.user?.email;
        if (!userEmail) {
          setExistingApplication(null);
          setFetching(false);
          return;
        }

        const result = await getMentorApplicationsAction(userEmail);
        if (result.success && result.applications && result.applications.length > 0) {
          setExistingApplication(convertDatabaseToForm(result.applications[0]));
          setSubmittedEmail(result.applications[0].email); // Set submittedEmail from loaded application
        } else {
          setExistingApplication(null);
          setSubmittedEmail(null);
        }
      } catch (e) {
        console.error("Error fetching application", e);
        setExistingApplication(null);
      } finally {
        setFetching(false);
      }
    }
    fetchApplication();
    // Prefill user info
    async function prefillUser() {
      try {
        const session = await authClient.getSession();
        if (session && "data" in session && session.data?.user) {
          if (session.data.user.name) form.setValue("name", session.data.user.name);
          if (session.data.user.email) form.setValue("email", session.data.user.email);
        }
      } catch {}
    }
    prefillUser();
  }, [form]);

  // Poll for application approval and redirect if approved
  React.useEffect(() => {
    if (!existingApplication) return;
    if (existingApplication.status === "approved") {
      router.replace("/dashboard?role=mentor");
      return;
    }
    const interval = setInterval(async () => {
      try {
        const result = await getMentorApplicationsAction(existingApplication.email);
        if (
          result.success &&
          result.applications &&
          result.applications[0]?.status === "approved"
        ) {
          router.replace("/dashboard?role=mentor");
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [existingApplication, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    form.setValue("pow", file as File, { shouldValidate: true });
    setFileName(file ? file.name : null);
  }
  function removeFile() {
    form.setValue("pow", undefined, { shouldValidate: true });
    setFileName(null);
  }

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setDeleteError(null);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("profile", data.profile || "");
      formData.append("experience", data.experience.toString());
      formData.append("expertise", data.expertise);
      formData.append("certifications", data.certifications);
      formData.append("mentorType", data.mentorType);
      if (data.pow instanceof File) {
        formData.append("pow", data.pow);
      }

      const result = await createMentorApplicationAction(formData);

      if (result.success) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
        // Fetch the latest application so the form is not shown again
        try {
          const applicationsResult = await getMentorApplicationsAction(data.email);
          if (
            applicationsResult.success &&
            applicationsResult.applications &&
            applicationsResult.applications.length > 0
          ) {
            setExistingApplication(convertDatabaseToForm(applicationsResult.applications[0]));
          }
        } catch {}
      } else {
        setDeleteError(result.error || "Submission failed");
      }
    } catch (e) {
      setDeleteError((e as Error)?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!submittedEmail) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const result = await deleteMentorApplicationAction(submittedEmail);

      if (result.success) {
        setSubmitted(false);
        setSubmittedEmail(null);
        setExistingApplication(null);
        toast.success("Application deleted successfully");
        // Redirect to mentors page after delete
        window.location.href = "/mentors/apply";
      } else {
        setDeleteError(result.error || "Delete failed");
        toast.error(result.error || "Delete failed");
      }
    } catch (e) {
      setDeleteError((e as Error)?.message || "Delete failed");
      toast.error((e as Error)?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }
  if (fetching) {
    return <div className="text-center mt-10">Loading...</div>;
  }
  if (submitted || existingApplication) {
    const applicationData = existingApplication || {
      id: crypto.randomUUID(),
      name: form.getValues("name"),
      email: submittedEmail || form.getValues("email"),
      phone: form.getValues("phone"),
      profile: null,
      experience: form.getValues("experience"),
      expertise: form.getValues("expertise"),
      certifications: form.getValues("certifications"),
      powUrl: null,
      status: "pending",
      mentorType: form.getValues("mentorType"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return (
      <MentorApplicationSubmission
        application={applicationData}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
        deleteError={deleteError}
      />
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 pt-3 pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mentor Application</h1>
            <p className="text-gray-600">Apply to become a certified YogVaidya mentor</p>
          </div>
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your phone number"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator />
                {/* Professional Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="text-gray-700 font-medium">
                            Years of Experience
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              placeholder="Enter years of experience"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expertise"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-gray-700 font-medium">
                            Areas of Expertise
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Hatha Yoga, Meditation"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="certifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Certifications
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. RYT 200, RYT 500"
                              className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pow"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Proof of Work (certificate/portfolio)
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="w-full h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                              />
                              {fileName && (
                                <>
                                  <span className="text-xs text-gray-600 truncate max-w-[120px]">
                                    {fileName}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={removeFile}
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator />
                {/* Mentor Type Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Mentor Type</h3>
                  <FormField
                    control={form.control}
                    name="mentorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Select Mentor Type
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger className="w-full h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent">
                              <SelectValue placeholder="Select the type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YOGAMENTOR">Yoga Mentor</SelectItem>
                              <SelectItem value="MEDITATIONMENTOR">Meditation Mentor</SelectItem>
                              <SelectItem value="DIETPLANNER">Diet Planner</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Agreements Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Agreements</h3>
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="consent"
                          />
                        </FormControl>
                        <FormLabel htmlFor="consent" className="!mt-0 cursor-pointer">
                          I agree to the{" "}
                          <a href="/terms" className="underline text-blue-600" target="_blank">
                            terms
                          </a>{" "}
                          and{" "}
                          <a href="/privacy" className="underline text-blue-600" target="_blank">
                            privacy policy
                          </a>
                          .
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white py-6"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </div>
  );
}
