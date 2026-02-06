/**
 * Atomic reminder locking utility
 *
 * Prevents duplicate reminders when multiple cron runs execute simultaneously.
 * Uses database UNIQUE constraint for race-condition-proof locking.
 *
 * How it works:
 * 1. Try to INSERT a lock record with (mosque_id, reminder_key, date, offset)
 * 2. If INSERT succeeds → we have the lock, proceed to send
 * 3. If INSERT fails with duplicate key (23505) → another cron run already claimed it, skip
 */

import { getSupabaseAdmin } from "./supabase";

export type ReminderType =
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "tahajjud"
  | "ishraq"
  | "awwabin"
  | "jumuah"
  | "hadith_morning"
  | "hadith_evening"
  | "suhoor"
  | "suhoor_planning"
  | "iftar"
  | "taraweeh";

/**
 * Attempt to claim exclusive lock for sending a reminder.
 * Uses database UNIQUE constraint for atomic, race-condition-proof locking.
 *
 * @param mosqueId - The mosque ID
 * @param reminderKey - Type of reminder (e.g., "tahajjud", "ishraq", "jumuah")
 * @param offset - Reminder offset in minutes (use 0 for reminders without offsets)
 * @returns true if lock acquired (should send), false if already claimed (skip)
 */
export async function tryClaimReminderLock(
  mosqueId: string,
  reminderKey: ReminderType,
  offset: number = 0
): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const { error } = await supabaseAdmin.from("prayer_reminder_locks").insert({
      mosque_id: mosqueId,
      prayer_key: reminderKey,
      reminder_date: today,
      reminder_offset: offset,
    });

    if (error) {
      // Duplicate key error (23505) means another cron run already claimed this slot
      if (error.code === "23505") {
        console.log(
          `[reminder-lock] Lock already claimed for ${reminderKey} at mosque ${mosqueId}`
        );
        return false;
      }

      // Table might not exist - log error but allow sending (fail open)
      // This ensures reminders still work if migration wasn't run
      if (error.code === "42P01") {
        // relation does not exist
        console.warn(
          "[reminder-lock] Lock table does not exist. Run migration 010_unified_reminder_locks.sql"
        );
        return true; // Fail open - allow sending
      }

      // Other errors - log but allow sending
      console.error("[reminder-lock] Unexpected error:", error.message, error.code);
      return true; // Fail open
    }

    // Lock acquired successfully
    console.log(
      `[reminder-lock] Lock acquired for ${reminderKey} at mosque ${mosqueId}`
    );
    return true;
  } catch (err) {
    console.error("[reminder-lock] Exception:", err);
    return true; // Fail open - allow sending on error
  }
}

/**
 * Clean up old locks to prevent table bloat.
 * Should be called periodically (e.g., once per day).
 */
export async function cleanupOldLocks(daysToKeep: number = 2): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("prayer_reminder_locks")
      .delete()
      .lt("reminder_date", cutoff)
      .select("id");

    if (error) {
      console.error("[reminder-lock] Cleanup error:", error.message);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[reminder-lock] Cleaned up ${count} old locks`);
    }
    return count;
  } catch (err) {
    console.error("[reminder-lock] Cleanup exception:", err);
    return 0;
  }
}
