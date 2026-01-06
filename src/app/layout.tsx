import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import "@/lib/prisma-middleware-trial";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SWRProvider } from "@/components/providers/swr-provider";

// Optimize font loading - prevents layout shift
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "YogVaidya",
  description: "A Yoga and Meditation App",
};

// Viewport configuration for better mobile performance
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#76d2fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <Toaster position="bottom-right" />
        <SWRProvider>
          <SidebarProvider>
            <main className="h-screen w-screen">{children}</main>
          </SidebarProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
