"use client";

import { motion } from "framer-motion";
import { Skeleton } from "./ui/skeleton";
import type { PrayerTimes } from "@/lib/prayer-times";
import { Sun, Sunrise, Clock, Moon, Sunset } from "lucide-react";

interface PrayerTimesDisplayProps {
  prayerTimes: PrayerTimes | null;
  loading?: boolean;
}

const prayerInfo = [
  { key: "fajr", name: "Fajr", icon: Sunrise, color: "text-blue-500" },
  { key: "sunrise", name: "Sunrise", icon: Sun, color: "text-amber-400" },
  { key: "dhuhr", name: "Dhuhr", icon: Sun, color: "text-yellow-500" },
  { key: "asr", name: "Asr", icon: Clock, color: "text-orange-500" },
  { key: "maghrib", name: "Maghrib", icon: Sunset, color: "text-red-500" },
  { key: "isha", name: "Isha", icon: Moon, color: "text-indigo-500" },
];

export function PrayerTimesDisplay({
  prayerTimes,
  loading,
}: PrayerTimesDisplayProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center p-3 rounded-xl bg-card"
          >
            <Skeleton className="w-6 h-6 rounded-full mb-2" />
            <Skeleton className="w-12 h-4 mb-1" />
            <Skeleton className="w-16 h-5" />
          </div>
        ))}
      </div>
    );
  }

  if (!prayerTimes) {
    return (
      <div className="text-center p-6 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground">
          Unable to load prayer times. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{prayerTimes.date}</span>
        <span className="text-primary font-medium">
          {prayerTimes.hijriDate} {prayerTimes.hijriMonth}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {prayerInfo.map((prayer, index) => {
          const time = prayerTimes[prayer.key as keyof PrayerTimes] as string;
          const Icon = prayer.icon;

          return (
            <motion.div
              key={prayer.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Icon className={`w-5 h-5 ${prayer.color} mb-1.5`} />
              <span className="text-xs text-muted-foreground font-medium">
                {prayer.name}
              </span>
              <span className="text-sm font-semibold text-foreground mt-0.5">
                {time}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
