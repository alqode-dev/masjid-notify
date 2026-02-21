"use client";

import { motion } from "framer-motion";
import { Skeleton } from "./ui/skeleton";
import type { PrayerTimes } from "@/lib/prayer-times";
import { Sun, Sunrise, Clock, Moon, Sunset } from "lucide-react";
import { ISHRAQ_MINUTES_AFTER_SUNRISE } from "@/lib/constants";
import {
  parseTime12hToMinutes,
  minutesToTime12h,
  addMinutesToTime,
  midpointTime,
} from "@/lib/time-format";

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

function formatHijriDate(prayerTimes: PrayerTimes): string {
  if (!prayerTimes.hijriDate || !prayerTimes.hijriMonth) return "";

  // hijriDate format is "DD-MM-YYYY"
  const parts = prayerTimes.hijriDate.split("-");
  const day = parseInt(parts[0], 10);
  if (isNaN(day)) return `${prayerTimes.hijriDate} ${prayerTimes.hijriMonth}`;

  // Use hijriYear field, or fall back to parsing from hijriDate string
  const year = prayerTimes.hijriYear || (parts.length >= 3 ? parts[2] : "");

  if (year) {
    return `${day} ${prayerTimes.hijriMonth} ${year} AH`;
  }
  return `${day} ${prayerTimes.hijriMonth}`;
}

function computeAdditionalTimes(prayerTimes: PrayerTimes) {
  const times: { label: string; time: string | null }[] = [];

  // Ishraq = Sunrise + 20 min
  const ishraq = addMinutesToTime(prayerTimes.sunrise, ISHRAQ_MINUTES_AFTER_SUNRISE);
  if (ishraq) {
    times.push({ label: "Ishraq", time: ishraq });
  }

  // Duha = Sunrise + (Dhuhr - Sunrise) / 4
  const sunriseMin = parseTime12hToMinutes(prayerTimes.sunrise);
  const dhuhrMin = parseTime12hToMinutes(prayerTimes.dhuhr);
  if (sunriseMin !== null && dhuhrMin !== null) {
    const span = dhuhrMin > sunriseMin ? dhuhrMin - sunriseMin : dhuhrMin + 1440 - sunriseMin;
    const duhaMin = sunriseMin + span / 4;
    times.push({ label: "Duha", time: minutesToTime12h(duhaMin) });
  }

  // Zawal = midpoint of sunrise and maghrib (solar noon)
  const zawal = midpointTime(prayerTimes.sunrise, prayerTimes.maghrib);
  if (zawal) {
    times.push({ label: "Zawal", time: zawal });
  }

  // Sunset = Maghrib
  times.push({ label: "Sunset", time: prayerTimes.maghrib });

  return times.filter((t) => t.time !== null) as { label: string; time: string }[];
}

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

  const hijriDisplay = formatHijriDate(prayerTimes);
  const additionalTimes = computeAdditionalTimes(prayerTimes);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{prayerTimes.date}</span>
        {hijriDisplay && (
          <span className="text-primary font-medium">{hijriDisplay}</span>
        )}
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

      {/* Additional Sun & Prayer Times */}
      {additionalTimes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Sun &amp; Additional Times
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {additionalTimes.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
