"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <footer className="bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] text-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Questions Section */}
          <div>
            <h2 className="text-4xl font-bold mb-2">
              Do you have
              <br />
              any questions?
            </h2>
            <p className="mb-6">
              Feel free to send us your questions or request a free
              consultation.
            </p>

            <div className="flex space-x-4">
              <Button className="bg-white hover:bg-gray-100 text-gray-800 rounded-md">
                SEND A MESSAGE
              </Button>

              <Button
                className="bg-transparent border border-white hover:bg-white/10 text-white rounded-md flex items-center"
                onClick={toggleChat}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with AI
              </Button>
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
                    It is necessary to follow a proper diet and exercise routine
                    along with yoga to maximize the benefits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="mt-16 flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-600 pt-6">
          {/* Email and Social Media */}
          <div>
            {/* Social Media Icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              {/* Navigation Links */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href="#services" className="hover:opacity-80">
                  Services
                </Link>
                <Link href="#plans" className="hover:opacity-80">
                  Pricing
                </Link>
                <Link href="#" className="hover:opacity-80">
                  Gallery
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
            <a
              href="mailto:hello@yogvaidya.com"
              className="text-lg font-medium hover:opacity-80"
            >
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
              Don&apos;t know where to start your yoga journey?
              <br />
              YogVaidya — practical, safe, and affordable.
            </p>
            <p>&copy; 2025 — Copyright</p>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-[#76d2fa] hover:bg-[#5abe9b] text-white rounded-full p-4 shadow-lg transition-all z-50 flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window - This is just a placeholder, you'd implement actual chat functionality here */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="bg-[#76d2fa] p-4 text-white flex justify-between items-center">
            <h3 className="font-medium">Chat with YogaBot</h3>
            <Button
              variant={"ghost"}
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
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-[#76d2fa] text-white"
                          : "bg-white text-gray-800 border"
                      }`}
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
              {error && (
                <div className="text-red-500 text-sm text-center">
                  Error: {error.message}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
                  value={input}
                  placeholder="Type your message..."
                  onChange={handleInputChange}
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
