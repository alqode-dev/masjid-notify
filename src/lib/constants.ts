// Mosque configuration
// For single mosque MVP: uses environment variable
// For future multi-mosque: will use dynamic routing from authenticated admin's mosque_id
export const DEFAULT_MOSQUE_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG || "anwaarul-islam-rondebosch-east";

// Time constants (in minutes)
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 1440; // 24 * 60
export const MINUTES_HALF_DAY = 720; // 12 * 60

// Cron job timing
export const CRON_WINDOW_MINUTES = 5; // Cron runs every 5 minutes
export const DUPLICATE_CHECK_MINUTES = 10; // Check for duplicates within this window

// Milliseconds constants
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const TEN_MINUTES_MS = 10 * MS_PER_MINUTE;
export const HADITH_API_DELAY_MS = 200; // Delay between hadith API retries

// Ramadan reminder timing (in minutes)
export const TARAWEEH_REMINDER_MINUTES = 30; // Send reminder 30 mins before Taraweeh
export const SUHOOR_PLANNING_OFFSET_MINUTES = 90; // Send planning reminder 90 mins after Isha

// Nafl salah timing (in minutes)
export const TAHAJJUD_MINUTES_BEFORE_FAJR = 120; // 2 hours before Fajr
export const ISHRAQ_MINUTES_AFTER_SUNRISE = 20; // 20 minutes after sunrise (Ishraq time per Sunnah)
export const AWWABIN_MINUTES_AFTER_MAGHRIB = 15; // 15 mins after Maghrib

// Hadith timing (in minutes)
export const HADITH_MINUTES_AFTER_PRAYER = 15; // Send hadith 15 mins after Fajr/Maghrib

// Jamaat timing
// Jamaat (congregation prayer) starts 15 minutes after Adhan for all prayers EXCEPT Maghrib
// Maghrib Jamaat starts immediately with Adhan (no delay)
export const JAMAAT_DELAY_MINUTES = 15;

// Subscriber preferences
export const VALID_REMINDER_OFFSETS = [5, 10, 15, 30] as const;
export type ReminderOffset = typeof VALID_REMINDER_OFFSETS[number];

// Shared reminder options for UI components
export const REMINDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
];

// Content validation
export const MAX_CONTENT_LENGTH = 4096;
