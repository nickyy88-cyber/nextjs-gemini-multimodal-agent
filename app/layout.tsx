import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Documind AI - Document Analyst",
  description: "Intelligent document analysis powered by AI",
};

// Triple Lock #1: Viewport meta - Prevent mobile zoom completely
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          {/* Main content - Full width on mobile, rounded on desktop */}
          <main className="flex-1 w-full md:rounded-l-3xl bg-white overflow-hidden shadow-2xl">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
