"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { SubscribeForm } from "@/components/subscribe-form";
import { PrayerTimesDisplay } from "@/components/prayer-times";
import { Footer } from "@/components/footer";
import { QRCodeMini } from "@/components/qr-code";
import { MapPin, Bell, QrCode, ArrowRight, Settings, BellRing } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import Link from "next/link";
import { NextSalahCountdown } from "@/components/next-salah-countdown";
import { formatDbTime } from "@/lib/time-format";
import type { Mosque } from "@/lib/supabase";
import type { PrayerTimes } from "@/lib/prayer-times";

interface LandingPageProps {
  mosque: Mosque;
  prayerTimes: PrayerTimes | null;
  siteUrl: string;
}

export function LandingPage({ mosque, prayerTimes, siteUrl }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-accent/20">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2">
          <span className="text-xs text-muted-foreground">{mosque.name}</span>
          <NotificationBell />
        </div>
      </div>
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          {/* Mosque Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 md:w-10 md:h-10 text-primary"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm3 14H9v-1h6v1zm0-2H9v-1h6v1z" />
              <path d="M12 4c-2.76 0-5 2.24-5 5 0 1.75.9 3.28 2.25 4.18V16h5.5v-2.82C16.1 12.28 17 10.75 17 9c0-2.76-2.24-5-5-5z" opacity="0.3" />
            </svg>
          </motion.div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {mosque.name}
          </h1>

          <a
            href={`https://www.google.com/maps?q=${mosque.latitude},${mosque.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm underline-offset-2 hover:underline">
              {mosque.city}, {mosque.country}
            </span>
          </a>

          {mosque.ramadan_mode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium"
            >
              <span className="text-lg">🌙</span>
              Ramadan Mubarak
            </motion.div>
          )}

          {mosque.eid_mode && mosque.eid_mode !== "off" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex flex-col items-center gap-1"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium">
                <span className="text-lg">{mosque.eid_mode === "eid_ul_fitr" ? "🌙" : "🐑"}</span>
                Eid Mubarak
              </div>
              {(mosque.eid_khutbah_time || mosque.eid_salah_time) && (
                <p className="text-xs text-muted-foreground">
                  {mosque.eid_khutbah_time && `Khutbah at ${formatDbTime(mosque.eid_khutbah_time)}`}
                  {mosque.eid_khutbah_time && mosque.eid_salah_time && " · "}
                  {mosque.eid_salah_time && `Salah at ${formatDbTime(mosque.eid_salah_time)}`}
                </p>
              )}
            </motion.div>
          )}

          {/* QR Code - Hidden on mobile, visible on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block mt-6"
          >
            <div className="flex items-center justify-center gap-3 p-3 bg-card/50 border border-border/30 rounded-xl">
              <QRCodeMini url={siteUrl} />
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <QrCode className="w-4 h-4 text-primary" />
                  Scan to Subscribe
                </div>
                <p className="text-xs text-muted-foreground">
                  Quick access via QR code
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Prayer Times Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl mb-8"
        >
          <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Today&apos;s Prayer Times
              </h2>
              {prayerTimes && <NextSalahCountdown prayerTimes={prayerTimes} />}
            </div>
            <PrayerTimesDisplay prayerTimes={prayerTimes} />
          </Card>
        </motion.div>

        {/* Subscribe Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Stay Connected
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Get prayer reminders and announcements on your device
              </p>
            </div>

            <SubscribeForm mosqueName={mosque.name} mosqueId={mosque.id} />
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl mt-8 md:mt-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FeatureCard
              icon="🕌"
              title="Prayer Reminders"
              description="Never miss a prayer with timely push notifications"
            />
            <LinkedFeatureCard
              href="/announcements"
              icon="📢"
              title="Announcements"
              description="Stay informed about events, classes, and programs"
            />
            <FeatureCard
              icon="🌙"
              title="Ramadan Ready"
              description="Suhoor, Iftar, and Taraweeh reminders"
            />
            <LinkedFeatureCard
              href="/listen"
              icon="🎧"
              title="Audio Library"
              description="Listen to lectures, tafsir, and more"
            />
            <LinkedFeatureCard
              href="/settings"
              lucideIcon={<Settings className="w-6 h-6 text-primary" />}
              title="Settings"
              description="Manage your notification preferences"
            />
            <LinkedFeatureCard
              href="/notifications"
              lucideIcon={<BellRing className="w-6 h-6 text-primary" />}
              title="Notifications"
              description="View your notification history"
            />
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-xl bg-card/50 border border-border/30 text-center"
    >
      <span className="text-2xl mb-2 block">{icon}</span>
      <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function LinkedFeatureCard({
  href,
  icon,
  lucideIcon,
  title,
  description,
}: {
  href: string;
  icon?: string;
  lucideIcon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="p-4 rounded-xl bg-primary/5 border border-primary/30 text-center h-full relative group"
      >
        {icon ? (
          <span className="text-2xl mb-2 block">{icon}</span>
        ) : (
          <span className="mb-2 flex justify-center">{lucideIcon}</span>
        )}
        <h3 className="font-semibold text-foreground text-sm mb-1 flex items-center justify-center gap-1">
          {title}
          <ArrowRight className="w-3.5 h-3.5 text-primary opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </motion.div>
    </Link>
  );
}
