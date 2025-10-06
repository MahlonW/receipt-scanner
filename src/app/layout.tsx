import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/contexts/DarkModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Receipt Scanner - AI-Powered Receipt Analysis",
  description: "Upload receipt images and get detailed product analysis with AI. Export to Excel, track expenses, and manage your receipts effortlessly.",
  keywords: ["receipt scanner", "AI", "expense tracking", "receipt analysis", "Excel export", "OCR"],
  authors: [{ name: "Receipt Scanner" }],
  creator: "Receipt Scanner",
  publisher: "Receipt Scanner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Receipt Scanner - AI-Powered Receipt Analysis",
    description: "Upload receipt images and get detailed product analysis with AI. Export to Excel, track expenses, and manage your receipts effortlessly.",
    url: "/",
    siteName: "Receipt Scanner",
    images: [
      {
        url: "/logo.svg",
        width: 32,
        height: 32,
        alt: "Receipt Scanner Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Receipt Scanner - AI-Powered Receipt Analysis",
    description: "Upload receipt images and get detailed product analysis with AI. Export to Excel, track expenses, and manage your receipts effortlessly.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
