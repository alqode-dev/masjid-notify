import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date/time formatting
export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

// Relative time (e.g., "in 15 minutes", "2 hours ago")
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const minutes = Math.round(diff / 60000);
  const hours = Math.round(diff / 3600000);

  if (Math.abs(minutes) < 1) return "now";
  if (minutes > 0 && minutes < 60) return `in ${minutes} min`;
  if (minutes < 0 && minutes > -60) return `${Math.abs(minutes)} min ago`;
  if (hours > 0 && hours < 24) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
  if (hours < 0 && hours > -24) return `${Math.abs(hours)} hour${Math.abs(hours) > 1 ? "s" : ""} ago`;

  return formatDateShort(date);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Prayer name formatting
export function formatPrayerName(prayer: string): string {
  const prayerMap: Record<string, string> = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    imsak: "Imsak",
  };
  return prayerMap[prayer.toLowerCase()] || prayer;
}

// Check if it's Friday (for Jumu'ah)
export function isFriday(timezone: string = "Africa/Johannesburg"): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timezone,
  });
  return formatter.format(now) === "Friday";
}
