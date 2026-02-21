import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masjid-notify.vercel.app";

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Masjid Notify - Stay Connected with Your Mosque",
  description:
    "Subscribe to receive prayer time reminders, Jumu'ah notifications, and important announcements from your local mosque.",
  keywords: [
    "mosque",
    "masjid",
    "prayer times",
    "salah",
    "jumuah",
    "notifications",
    "islamic",
    "muslim",
    "pwa",
  ],
  authors: [{ name: "Alqode" }],
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Masjid Notify",
  },
  openGraph: {
    title: "Masjid Notify - Stay Connected with Your Mosque",
    description:
      "Subscribe to receive prayer time reminders and announcements from your mosque.",
    type: "website",
    url: siteUrl,
    siteName: "Masjid Notify",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Masjid Notify - Prayer Reminders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Masjid Notify - Stay Connected with Your Mosque",
    description:
      "Subscribe to receive prayer time reminders and announcements from your mosque.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
