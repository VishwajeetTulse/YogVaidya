"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  showBackButton?: boolean;
  navItems?: NavItem[];
  currentPath?: string;
}

export default function Navbar({
  showBackButton = false,
  navItems = [],
  currentPath = "",
}: NavbarProps) {
  
  const { data: session } = useSession();

  return (
    <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>
          <span className="text-2xl font-semibold text-gray-800">
            YogVaidya
          </span>
        </Link>
      </div>

      {navItems.length > 0 && (
        <nav className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${
                currentPath === item.href
                  ? "text-indigo-600"
                  : "text-gray-800 hover:text-indigo-600"
              } transition-colors`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex items-center space-x-4">
        {showBackButton && (
          <Link href="/" className="text-gray-800 hover:text-indigo-600 transition-colors flex items-center mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        )}
        {/* Only show Sign In/Sign Up if not signed in and not loading */}
        {!session && (
          <>
            <Link href="/signin?from=navbar">
              <Button variant="outline" className="rounded-full border-2 border-gray-900 hover:bg-gray-100 text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup?from=navbar">
              <Button className="rounded-full bg-[#76d2fa] hover:bg-[#5a9be9] text-white">
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
