import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
  themeColor: "#E6E8E3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${libreBaskerville.variable} font-sans antialiased`}>
        <div className="flex h-screen bg-paper">
          {/* Main content - Full width on mobile, rounded on desktop */}
          <main className="flex-1 w-full md:rounded-l-3xl bg-card-cream overflow-hidden shadow-2xl">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
