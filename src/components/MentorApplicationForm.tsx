"use client";
import React, { useState } from "react";
import { CheckCircle, User, Briefcase, FileText, Link as LinkIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";

const steps = [
  {
    label: "Personal Info",
    description: "Tell us about yourself.",
    icon: <User className="w-5 h-5" />,
  },
  {
    label: "Experience",
    description: "Share your teaching background and expertise.",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: "Certification",
    description: "Upload your certifications and proof of work.",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Review",
    description: "Review your application before submitting.",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const formSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  profile: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  experience: z.string().min(10, "Please describe your experience"),
  expertise: z.string().min(2, "Please enter your areas of expertise"),
  certifications: z.string().min(2, "Please enter your certifications"),
  pow: z.any().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms." }) }),
});

type FormValues = z.infer<typeof formSchema>;

export default function MentorApplicationForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      profile: "",
      experience: "",
      expertise: "",
      certifications: "",
      pow: undefined,
      consent: true,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    form.setValue("pow", file as File, { shouldValidate: true });
    setFileName(file ? file.name : null);
  }
  function removeFile() {
    form.setValue("pow", undefined, { shouldValidate: true });
    setFileName(null);
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onSubmit(data: FormValues) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1800);
    // TODO: Submit form data to backend
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 shadow-lg border border-gray-100 mt-10 mb-10 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Application Submitted!</h2>
        <p className="text-gray-700">Thank you for applying as a mentor. We will review your application and contact you soon.</p>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 mb-10 animate-fade-in">
      <CardHeader>
        <CardTitle>Mentor Application Form</CardTitle>
        <CardDescription>Apply to become a certified YogaVaidya mentor.</CardDescription>
        <div className="flex items-center gap-2 mt-4">
          {steps.map((s, idx) => (
            <div key={s.label} className="flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${idx === step ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-lg' : 'bg-gray-100 text-gray-400 border-gray-300'}`}>{s.icon}</div>
              {idx < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-1 rounded transition-all duration-300" />}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600 min-h-[24px]">{steps[step].description}</div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 0 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn / Profile URL <span className="text-xs text-gray-400">(optional)</span></FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaching Experience</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your teaching experience" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas of Expertise</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Hatha Yoga, Meditation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. RYT 200, RYT 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pow"
                  render={() => (
                    <FormItem>
                      <FormLabel>Proof of Work (certificate/portfolio)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full" />
                          {fileName && (
                            <>
                              <span className="text-xs text-gray-600 truncate max-w-[120px]">{fileName}</span>
                              <Button type="button" size="sm" variant="outline" onClick={removeFile}>Remove</Button>
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Full Name:</span> {form.getValues("name")}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {form.getValues("email")}
                </div>
                <div>
                  <span className="font-semibold">Phone:</span> {form.getValues("phone")}
                </div>
                {form.getValues("profile") && (
                  <div>
                    <span className="font-semibold">Profile URL:</span> <a href={form.getValues("profile")} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{form.getValues("profile")}</a>
                  </div>
                )}
                <div>
                  <span className="font-semibold">Experience:</span> {form.getValues("experience")}
                </div>
                <div>
                  <span className="font-semibold">Expertise:</span> {form.getValues("expertise")}
                </div>
                <div>
                  <span className="font-semibold">Certifications:</span> {form.getValues("certifications")}
                </div>
                <div>
                  <span className="font-semibold">Proof of Work:</span> {fileName || "Not uploaded"}
                </div>
              </div>
            )}
            {/* Consent Checkbox always visible on last step */}
            {step === steps.length - 1 && (
              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 mt-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="consent" />
                    </FormControl>
                    <FormLabel htmlFor="consent" className="!mt-0 cursor-pointer">
                      I agree to the <a href="/terms" className="underline text-blue-600" target="_blank">terms</a> and <a href="/privacy" className="underline text-blue-600" target="_blank">privacy policy</a>.
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <CardFooter className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevStep} disabled={step === 0 || loading}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep} disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="default" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
