import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  BookOpen, 
  Video,
  ChevronRight,
  Search
} from "lucide-react";

export const SupportSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get help when you need it. We&apos;re here to support your wellness journey.
        </p>
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Live Chat</p>
              <p className="text-sm text-gray-500">Get instant help</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">Email Support</p>
              <p className="text-sm text-gray-500">24-48 hour response</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/5 border border-[#876aff]/30">
          <div className="flex items-center gap-3">
            <Phone className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">Phone Support</p>
              <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>

      {/* Search Help */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Search Help Articles</h3>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help articles, tutorials, or FAQs..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
          />
        </div>
      </Card>

      {/* Popular Help Topics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Help Topics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Getting Started with Yoga", icon: BookOpen, category: "Beginner" },
            { title: "Booking Your First Session", icon: Video, category: "Classes" },
            { title: "Managing Your Subscription", icon: HelpCircle, category: "Billing" },
            { title: "Technical Issues", icon: MessageSquare, category: "Support" },
            { title: "Canceling Classes", icon: BookOpen, category: "Classes" },
            { title: "Payment Problems", icon: HelpCircle, category: "Billing" }
          ].map((topic, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <topic.icon className="w-5 h-5 text-[#876aff]" />
                <div>
                  <p className="font-medium">{topic.title}</p>
                  <p className="text-sm text-gray-500">{topic.category}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            {
              question: "How do I book a yoga session?",
              answer: "You can book a session by going to the 'My Classes' section and clicking 'Book New Session'. Choose your preferred mentor, time, and type of session."
            },
            {
              question: "Can I cancel or reschedule a session?",
              answer: "Yes, you can cancel or reschedule sessions up to 2 hours before the scheduled time. Go to 'My Classes' and click on the session you want to modify."
            },
            {
              question: "What equipment do I need for online sessions?",
              answer: "You'll need a yoga mat, comfortable clothing, and a stable internet connection. Some sessions may require props like blocks or straps, which will be mentioned in the session description."
            },
            {
              question: "How do I upgrade my subscription plan?",
              answer: "Visit the 'Upgrade Plans' section in your dashboard to view available plans and upgrade instantly. Your new benefits will be available immediately."
            }
          ].map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button className="w-full text-left p-4 hover:bg-gray-50 focus:outline-none">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{faq.question}</p>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              <div className="px-4 pb-4">
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Support Hours</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
              <p>Saturday: 10:00 AM - 4:00 PM IST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Emergency Support</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>For urgent technical issues during live sessions:</p>
              <p className="font-medium text-[#876aff]">+91 98765 43210</p>
              <p className="font-medium text-[#876aff]">emergency@yogavaidya.com</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Still Need Help */}
      <Card className="p-6 bg-gradient-to-r from-[#76d2fa]/10 to-[#876aff]/10 border border-[#76d2fa]/30">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  );
};
