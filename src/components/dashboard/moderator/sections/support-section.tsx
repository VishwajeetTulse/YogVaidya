"use client";

import { useState } from "react";
import { ModeratorSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Mail,
  Search,
  ChevronRight,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    id: "faq-1",
    question: "How do I approve mentor applications?",
    answer:
      "Navigate to the 'Mentor Applications' section in the sidebar. Review each application by clicking on it, and use the approve/reject buttons at the bottom of the application details.",
    category: "mentors",
  },
  {
    id: "faq-2",
    question: "How do I update my notification settings?",
    answer:
      "Go to the 'Settings' section and scroll down to 'Notification Preferences'. Toggle the switches for different notification types according to your preference.",
    category: "settings",
  },
  {
    id: "faq-3",
    question: "How do I view user activity logs?",
    answer:
      "Navigate to 'User Management', find the user in question, click on their profile, then select the 'Activity' tab to view their complete activity history.",
    category: "users",
  },
  {
    id: "faq-4",
    question: "What permissions do I have as a moderator?",
    answer:
      "As a moderator, you can approve/reject mentor applications, manage user accounts, view analytics, and customize your own dashboard settings. You cannot change system-wide configurations or access billing information.",
    category: "permissions",
  },
  {
    id: "faq-5",
    question: "How do I export user data for reporting?",
    answer:
      "From the 'Analytics' section, you can generate custom reports and export them as CSV or PDF using the export button in the top-right corner of each report view.",
    category: "analytics",
  },
];

export const SupportSection = ({ userDetails }: ModeratorSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"faqs" | "contact" >(
    "contact"
  );
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Filter FAQs based on search query
  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaqExpand = (id: string) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get assistance, documentation, and answers to common questions.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          placeholder="Search for help topics, FAQs, or keywords..."
          className="pl-10 bg-gray-50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant={activeTab === "contact" ? "default" : "ghost"}
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
          data-state={activeTab === "contact" ? "active" : "inactive"}
          onClick={() => setActiveTab("contact")}
        >
          <MessageSquare className="mr-2" size={18} />
          Contact Support
        </Button>
        <Button
          variant={activeTab === "faqs" ? "default" : "ghost"}
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
          data-state={activeTab === "faqs" ? "active" : "inactive"}
          onClick={() => setActiveTab("faqs")}
        >
          <HelpCircle className="mr-2" size={18} />
          FAQs
        </Button>
      </div>

      {/* FAQs Content */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          {searchQuery && filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <FileQuestion size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No FAQs match your search</h3>
              <p className="text-gray-500 mt-2">
                Try using different keywords or check the documentation
              </p>
            </div>
          ) : (
            <>
              {/* FAQ List */}
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <Card key={faq.id} className="overflow-hidden">
                    <div
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleFaqExpand(faq.id)}
                    >
                      <div>
                        <h3 className="font-medium">{faq.question}</h3>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {faq.category}
                        </Badge>
                      </div>
                      <ChevronRight
                        className={`transition-transform ${
                          expandedFaq === faq.id ? "rotate-90" : ""
                        }`}
                        size={20}
                      />
                    </div>
                    {expandedFaq === faq.id && (
                      <div className="p-4 pt-0 border-t">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Contact Support Content */}
      {activeTab === "contact" && (
        <div className="p-3 bg-accent rounded-lg shadow-sm space-y-6">
            <Card className="p-6 space-y-6 ">
              <div>
                <h3 className="font-medium flex items-center">
                  <PhoneCall size={18} className="mr-2 text-primary" />
                  Phone Support
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Available Mon-Fri, 9am-5pm
                </p>
                <p className="font-medium mt-2">+1 (555) 123-4567</p>
              </div>
            </Card>
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-medium flex items-center">
                  <Mail size={18} className="mr-2 text-primary" />
                  Email Support
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  24/7 response within 24 hours
                </p>
                <p className="font-medium mt-2">support@yogavaidya.com</p>
              </div>
            </Card>
        </div>
      )}
    </div>
  );
};
