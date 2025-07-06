import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Mail,
  HelpCircle
} from "lucide-react";

export const SupportSection = () => {
  const faqs = [
    {
      question: "How do I reschedule a session?",
      answer: "You can reschedule sessions up to 24 hours in advance through your dashboard. Go to 'My Sessions' and click on the session you want to reschedule."
    },
    {
      question: "What if a student doesn't show up?",
      answer: "If a student doesn't join within 15 minutes of the scheduled time, mark it as a no-show in your dashboard. You'll still receive compensation for confirmed sessions."
    },
    {
      question: "How do I update my availability?",
      answer: "Go to Settings > Availability to update your weekly schedule. Changes will apply to future bookings."
    },
    {
      question: "When do I receive payments?",
      answer: "Payments are processed weekly on Fridays for sessions completed in the previous week. Direct deposits typically arrive within 2-3 business days."
    },
    {
      question: "Can I specialize in specific yoga styles?",
      answer: "Yes! Update your profile to highlight your specializations. This helps match you with students looking for specific practices like Hatha, Vinyasa, or Yin yoga."
    },
    {
      question: "How do I handle technical issues during sessions?",
      answer: "If you experience technical difficulties, first check your internet connection. If issues persist, contact our tech support immediately. We provide backup communication methods for emergencies."
    },
    {
      question: "Can I cancel a session?",
      answer: "You can cancel sessions up to 24 hours in advance without penalty. For emergency cancellations, contact support immediately to discuss options."
    },
    {
      question: "How do I report inappropriate student behavior?",
      answer: "Report any inappropriate behavior immediately through the 'Report Issue' button in your session dashboard or contact our support team directly."
    }
  ];

  const contactOptions = [
    {
      title: "Email Support",
      description: "mentor-support@yogavaidya.com",
      icon: Mail,
      response: "24-48 hours",
      details: "Perfect for non-urgent questions, feedback, or detailed inquiries. Our support team will get back to you with comprehensive answers."
    },
    {
      title: "Phone Support",
      description: "+1 (555) 123-YOGA",
      icon: Phone,
      response: "Mon-Fri 9AM-6PM EST",
      details: "Speak directly with our support team for immediate assistance with urgent matters or complex issues."
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get help with frequently asked questions or contact our support team.
        </p>
      </div>

      {/* Tabs for FAQ and Contact Support */}
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
        </TabsList>

        {/* FAQ Tab Content */}
        <TabsContent value="faq" className="space-y-4">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Find answers to the most common questions from mentors like you.
            </p>
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">{faq.question}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contact Support Tab Content */}
        <TabsContent value="contact" className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Need personalized help? Choose the best way to reach our support team.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactOptions.map((contact, index) => (
                <Card key={index} className="h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <contact.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{contact.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Response: {contact.response}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {contact.details}
                      </p>
                      
                      <Button variant="outline" className="w-full">
                        {contact.title === "Email Support" && "Send Email"}
                        {contact.title === "Phone Support" && "Call Now"}
                        {contact.title === "Live Chat" && "Start Chat"}
                        {contact.title === "Priority Support" && "Contact Priority"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Additional Help Note */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Can&apos;t find what you&apos;re looking for?</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      Our support team is here to help with any questions not covered in the FAQ. 
                      Don&apos;t hesitate to reach out!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

