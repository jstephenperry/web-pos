import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./theme-provider";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web POS - Point of Sale System",
  description: "Modern web-based point of sale system for retail and service businesses. Fast, secure, and easy to use.",
  keywords: ["pos", "point of sale", "payment", "retail", "e-commerce", "checkout"],
  authors: [{ name: "Web POS Team" }],
  robots: "index, follow",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Web POS - Point of Sale System",
    description: "Modern web-based point of sale system for retail and service businesses",
    type: "website",
    locale: "en_US",
    siteName: "Web POS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web POS - Point of Sale System",
    description: "Modern web-based point of sale system for retail and service businesses. Fast, secure, and easy to use.",
    creator: "@webpos",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Web POS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="no-theme-yet theme-transition">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
