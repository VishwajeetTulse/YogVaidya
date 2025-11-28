"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Instagram, MessageCircle, X, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show tooltip after component mounts every time
  useEffect(() => {
    if (!isClient) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000); // Show tooltip after 2 seconds
    return () => clearTimeout(timer);
  }, [isClient]);

  const handleTooltipClose = () => {
    setShowTooltip(false);
  };

  const handleTooltipTryNow = () => {
    setShowTooltip(false);
    setIsChatOpen(true);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage, error } = useChat();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  // Helper to extract text content from message parts
  const getMessageText = (message: typeof messages[0]) => {
    if (!message.parts) return "";
    return message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  return (
    <footer className="bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] text-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Questions Section */}
          <div>
            <h2 className="text-4xl font-bold mb-2">
              Ready to begin
              <br />
              your wellness journey?
            </h2>
            <p className="mb-6">
              Connect with certified mentors for Yoga, Meditation, and Diet Planning. Start with a
              free consultation or chat with our AI assistant.
            </p>

            <div className="flex space-x-4">
              <Button
                className="bg-transparent border border-white hover:bg-white/10 text-white rounded-md flex items-center"
                onClick={toggleChat}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with AI
              </Button>

              <Link href="/mentors">
                <Button className="bg-white hover:bg-gray-100 text-gray-800 rounded-md">
                  FIND MENTORS
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Information */}
          <div className="flex items-center justify-end">
            <div className="flex gap-10 items-start">
              <div>
                {/* Placeholder for information that might be on the right */}
                <Image
                  src="/assets/meditation.svg"
                  alt="YogVaidya Logo"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>

              <div className="max-w-xs">
                <div className="h-12 border-l-2 border-gray-800 pl-4 mb-4">
                  <p>
                    Transform your lifestyle with personalized guidance from certified professionals
                    in Yoga, Meditation, and Nutrition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-600">
          {/* Email and Social Media */}
          <div>
            {/* Social Media Icons */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-6">
              {/* Legal & Support Links */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/privacy" className="hover:opacity-80">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:opacity-80">
                  Terms of Service
                </Link>
                <Link href="/help" className="hover:opacity-80">
                  Help Center
                </Link>
                <Link href="/about" className="hover:opacity-80">
                  About Us
                </Link>
              </div>
            </div>
            <div className="flex space-x-3 mb-6">
              <a
                href="#"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Facebook size={16} className="text-gray-800" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Twitter size={16} className="text-gray-800" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Linkedin size={16} className="text-gray-800" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Instagram size={16} className="text-gray-800" />
              </a>
            </div>

            {/* Email */}
            <div className="mb-1 text-sm uppercase">EMAIL</div>
            <a href="mailto:hello@yogvaidya.com" className="text-lg font-medium hover:opacity-80">
              hello@yogvaidya.com
            </a>
          </div>

          {/* CTA and Copyright */}
          <div className="mt-6 md:mt-0 text-right">
            {/* Logo image above the CTA text */}
            <div className="flex justify-end mb-4">
              <Image
                src="/assets/footer.png"
                alt="YogVaidya Logo"
                width={200}
                height={200}
                className="rounded-full"
              />
            </div>

            <p className="mb-1">
              Ready to start your wellness journey?
              <br />
              Connect with expert mentors in Yoga, Meditation & Diet Planning.
            </p>
            <p>&copy; 2025 YogVaidya — All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-[#76d2fa] hover:bg-[#5abe9b] text-white rounded-full p-4 shadow-lg transition-all flex items-center justify-center relative"
        >
          <MessageCircle size={24} />
          {/* Pulse animation for users */}
          <div className="absolute inset-0 rounded-full bg-[#76d2fa] animate-ping opacity-30" />
        </button>

        {/* Tooltip/Popup */}
        {showTooltip && (
          <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-2xl border p-6 transform transition-all duration-300 ease-out">
            {/* Close button */}
            <button
              onClick={handleTooltipClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Tooltip content */}
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] rounded-full p-2 flex-shrink-0">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">Hi there! 👋</h4>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Need help starting your yoga journey? I&apos;m here to guide you.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTooltipTryNow}
                    size="sm"
                    className="bg-[#76d2fa] hover:bg-[#5abe9b] text-white text-xs px-3 py-1.5"
                  >
                    Chat Now
                  </Button>
                  <Button
                    onClick={handleTooltipClose}
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>

            {/* Tooltip arrow */}
            <div className="absolute bottom-[-8px] right-8 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
          </div>
        )}
      </div>

      {/* Chat Window - This is just a placeholder, you'd implement actual chat functionality here */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="bg-[#76d2fa] p-4 text-white flex justify-between items-center">
            <h3 className="font-medium">Chat with YogaBot</h3>
            <Button
              variant="ghost"
              onClick={toggleChat}
              className="text-white hover:bg-transparent"
            >
              &times;
            </Button>
          </div>
          <div className="flex flex-col h-96">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center text-sm">
                  Welcome! How can I help you with your yoga journey today?
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-[#76d2fa] text-white"
                          : "bg-white text-gray-800 border"
                      }`}
                    >
                      <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
              {error && (
                <div className="text-red-500 text-sm text-center">Error: {error.message}</div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-3">
              <form onSubmit={onSubmit} className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                  value={inputValue}
                  placeholder="Type your message..."
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#76d2fa] hover:bg-[#5abe9b] text-white px-4"
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
