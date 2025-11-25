import type { Metadata } from "next";
import "@/app/globals.css";
import "@/lib/prisma-middleware-trial";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "YogVaidya",
  description: "A Yoga and Meditation App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster position="bottom-right" />
        <SidebarProvider>
          <main className="h-screen w-screen">{children}</main>
        </SidebarProvider>
      </body>
    </html>
  );
}
