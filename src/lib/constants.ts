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
