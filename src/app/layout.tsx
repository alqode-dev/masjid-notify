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
  openGraph: {
    title: "Masjid Notify - Stay Connected with Your Mosque",
    description:
      "Subscribe to receive prayer time reminders and announcements via WhatsApp.",
    type: "website",
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
