import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Masjid Notify - Stay Connected with Your Mosque",
  description:
    "Subscribe to receive prayer time reminders, Jumu'ah notifications, and important announcements from your local mosque via WhatsApp.",
  keywords: [
    "mosque",
    "masjid",
    "prayer times",
    "salah",
    "jumuah",
    "whatsapp",
    "notifications",
    "islamic",
    "muslim",
  ],
  authors: [{ name: "Alqode" }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Masjid Notify - Stay Connected with Your Mosque",
    description:
      "Subscribe to receive prayer time reminders and announcements via WhatsApp.",
    type: "website",
    url: siteUrl,
    siteName: "Masjid Notify",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Masjid Notify - Prayer Reminders on WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Masjid Notify - Stay Connected with Your Mosque",
    description:
      "Subscribe to receive prayer time reminders and announcements via WhatsApp.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
