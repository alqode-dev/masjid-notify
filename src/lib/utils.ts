import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// South African phone number validation and formatting
const SA_PHONE_REGEX = /^(\+27|27|0)?[6-8][0-9]{8}$/;

export function isValidSAPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return SA_PHONE_REGEX.test(cleaned);
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Handle different formats and normalize to +27 format
  if (cleaned.startsWith("0")) {
    cleaned = "+27" + cleaned.slice(1);
  } else if (cleaned.startsWith("27") && !cleaned.startsWith("+27")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+27")) {
    cleaned = "+27" + cleaned;
  }

  return cleaned;
}

/**
 * Normalize phone number to +27 format for consistent storage and lookup.
 * Handles +27, 27, and 0 prefixes consistently.
 *
 * Examples:
 * - "0821234567" -> "+27821234567"
 * - "27821234567" -> "+27821234567"
 * - "+27821234567" -> "+27821234567"
 * - "821234567" -> "+27821234567"
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Handle different formats and normalize to +27 format
  if (cleaned.startsWith("0")) {
    // Local format: 0821234567 -> +27821234567
    cleaned = "+27" + cleaned.slice(1);
  } else if (cleaned.startsWith("+27")) {
    // Already in correct format
    // No change needed
  } else if (cleaned.startsWith("27")) {
    // Missing + prefix: 27821234567 -> +27821234567
    cleaned = "+" + cleaned;
  } else {
    // Just the local number without prefix: 821234567 -> +27821234567
    cleaned = "+27" + cleaned;
  }

  return cleaned;
}

export function formatPhoneForDisplay(phone: string): string {
  const cleaned = formatPhoneNumber(phone);
  // Format as +27 XX XXX XXXX
  if (cleaned.length === 12 && cleaned.startsWith("+27")) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return cleaned;
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

// Generate a random token for subscriber settings links
export function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
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
