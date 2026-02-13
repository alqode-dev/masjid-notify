"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import type { PrayerTimes } from "@/lib/prayer-times";

interface NextSalahCountdownProps {
  prayerTimes: PrayerTimes;
}

const SALAH_ORDER = [
  { key: "fajr", name: "Fajr" },
  { key: "dhuhr", name: "Dhuhr" },
  { key: "asr", name: "Asr" },
  { key: "maghrib", name: "Maghrib" },
  { key: "isha", name: "Isha" },
] as const;

function parseTimeTo24(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

function getNextPrayer(prayerTimes: PrayerTimes): { name: string; diffMs: number } | null {
  const now = new Date();
  const nowMs = now.getTime();

  for (const salah of SALAH_ORDER) {
    const timeStr = prayerTimes[salah.key as keyof PrayerTimes] as string;
    const parsed = parseTimeTo24(timeStr);
    if (!parsed) continue;

    const prayerDate = new Date(now);
    prayerDate.setHours(parsed.hours, parsed.minutes, 0, 0);

    if (prayerDate.getTime() > nowMs) {
      return { name: salah.name, diffMs: prayerDate.getTime() - nowMs };
    }
  }

  // All prayers passed — next is Fajr tomorrow
  const fajrStr = prayerTimes.fajr;
  const fajrParsed = parseTimeTo24(fajrStr);
  if (!fajrParsed) return null;

  const fajrTomorrow = new Date(now);
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  fajrTomorrow.setHours(fajrParsed.hours, fajrParsed.minutes, 0, 0);

  return { name: "Fajr", diffMs: fajrTomorrow.getTime() - nowMs };
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function NextSalahCountdown({ prayerTimes }: NextSalahCountdownProps) {
  const [next, setNext] = useState<{ name: string; diffMs: number } | null>(null);

  useEffect(() => {
    const update = () => setNext(getNextPrayer(prayerTimes));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  if (!next) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto w-fit mb-3">
      <Clock className="w-3.5 h-3.5" />
      <span>Next: {next.name} in {formatCountdown(next.diffMs)}</span>
    </div>
  );
}
