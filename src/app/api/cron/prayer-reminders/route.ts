import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes, isWithinMinutes, getJamaatTime } from "@/lib/prayer-times";
import {
  PRAYER_REMINDER_TEMPLATE,
  ANNOUNCEMENT_TEMPLATE,
} from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
  CronLogContext,
} from "@/lib/logger";
import {
  sendTemplatesConcurrently,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
} from "@/lib/message-sender";
import { previewTemplate } from "@/lib/whatsapp-templates";
import type { Mosque, Subscriber, ScheduledMessage } from "@/lib/supabase";
import { TEN_MINUTES_MS } from "@/lib/constants";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// Maximum retry attempts before marking a scheduled message as permanently failed
const MAX_SCHEDULED_MESSAGE_RETRIES = 5;

// Process scheduled messages that are due for sending
// Called from the main cron handler to check for any pending scheduled messages
async function processScheduledMessages(logger: CronLogContext): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  // Query for due scheduled messages (scheduled_at <= now AND status = 'pending')
  const { data: scheduledMessages, error } = await supabaseAdmin
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (error) {
    logCronError(logger, "Failed to fetch scheduled messages", { error });
    return { processed: 0, successful: 0, failed: 0 };
  }

  if (!scheduledMessages || scheduledMessages.length === 0) {
    return { processed: 0, successful: 0, failed: 0 };
  }

  let successful = 0;
  let failed = 0;

  for (const scheduled of scheduledMessages as ScheduledMessage[]) {
    try {
      // Get mosque details for the announcement message format
      const { data: mosque } = await supabaseAdmin
        .from("mosques")
        .select("name")
        .eq("id", scheduled.mosque_id)
        .single();

      const mosqueName = mosque?.name || "Mosque";

      // Get active subscribers for this mosque who opted in to announcements
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", scheduled.mosque_id)
        .eq("status", "active")
        .eq("pref_announcements", true);

      if (!subscribers || subscribers.length === 0) {
        // No subscribers - mark as sent anyway (nothing to send)
        await supabaseAdmin
          .from("scheduled_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", scheduled.id);
        successful++;
        continue;
      }

      // Template variables: mosque_name, announcement_content
      const templateVars = [mosqueName, scheduled.content];

      // Send messages concurrently using template
      const batchResult = await sendTemplatesConcurrently(
        subscribers as Subscriber[],
        ANNOUNCEMENT_TEMPLATE,
        templateVars,
        logger
      );

      // Generate message content for logging (preview with actual values)
      const message = previewTemplate(ANNOUNCEMENT_TEMPLATE, templateVars);

      // Batch update last_message_at for successful sends
      const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
      await batchUpdateLastMessageAt(successfulIds);

      // Log the scheduled message as sent in messages table
      const { error: msgError } = await supabaseAdmin.from("messages").insert({
        mosque_id: scheduled.mosque_id,
        type: "announcement",
        content: scheduled.content,
        sent_to_count: batchResult.successful,
        status: "sent",
        metadata: {
          scheduled: true,
          scheduled_at: scheduled.scheduled_at,
          scheduled_message_id: scheduled.id,
        },
      });
      if (msgError) {
        console.error('[prayer-reminders] Failed to log scheduled message:', msgError.message, msgError.code, msgError.details);
        // Retry without metadata in case the column doesn't exist yet
        if (msgError.code === "PGRST204") {
          await supabaseAdmin.from("messages").insert({
            mosque_id: scheduled.mosque_id,
            type: "announcement",
            content: scheduled.content,
            sent_to_count: batchResult.successful,
            status: "sent",
          });
        }
      }

      // Mark the scheduled message as sent
      await supabaseAdmin
        .from("scheduled_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", scheduled.id);

      successful++;
    } catch (err) {
      // Handle individual failure without stopping the batch
      const currentRetries = (scheduled.retry_count ?? 0) + 1;

      logCronError(logger, "Failed to process scheduled message", {
        scheduledMessageId: scheduled.id,
        mosqueId: scheduled.mosque_id,
        retryCount: currentRetries,
        maxRetries: MAX_SCHEDULED_MESSAGE_RETRIES,
        error: err instanceof Error ? err.message : String(err),
      });

      // Update retry count or mark as failed if max retries exceeded
      if (currentRetries >= MAX_SCHEDULED_MESSAGE_RETRIES) {
        // Max retries exceeded - mark as permanently failed
        await supabaseAdmin
          .from("scheduled_messages")
          .update({
            status: "failed",
            retry_count: currentRetries,
          })
          .eq("id", scheduled.id);

        logCronError(logger, "Scheduled message permanently failed after max retries", {
          scheduledMessageId: scheduled.id,
          mosqueId: scheduled.mosque_id,
        });
      } else {
        // Increment retry count for next attempt
        await supabaseAdmin
          .from("scheduled_messages")
          .update({ retry_count: currentRetries })
          .eq("id", scheduled.id);
      }

      failed++;
    }
  }

  return {
    processed: scheduledMessages.length,
    successful,
    failed,
  };
}

/**
 * Attempt to claim exclusive lock for sending a prayer reminder.
 * Uses database UNIQUE constraint for atomic, race-condition-proof locking.
 *
 * How it works:
 * 1. Try to INSERT a lock record
 * 2. If INSERT succeeds → we have the lock, proceed to send
 * 3. If INSERT fails (duplicate key) → another cron run already claimed it, skip
 *
 * This is the ONLY way to prevent duplicates with concurrent serverless functions.
 *
 * @returns true if lock acquired (should send), false if already claimed (skip)
 */
async function tryClaimReminderLock(
  mosqueId: string,
  prayerKey: string,
  offset: number
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { error } = await supabaseAdmin.from("prayer_reminder_locks").insert({
    mosque_id: mosqueId,
    prayer_key: prayerKey,
    reminder_date: today,
    reminder_offset: offset,
  });

  if (error) {
    // Duplicate key error (23505) means another cron run already claimed this slot
    if (error.code === "23505") {
      return false; // Lock already claimed - skip sending
    }
    // Log other errors but don't block sending (fail open for now)
    console.error("[prayer-reminders] Lock claim error:", error.message, error.code);
    // Fall through to legacy check as backup
  } else {
    return true; // Lock acquired - proceed to send
  }

  // Fallback: If lock table doesn't exist yet, use legacy time-based check
  const tenMinutesAgo = new Date(Date.now() - TEN_MINUTES_MS).toISOString();
  const { data } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("mosque_id", mosqueId)
    .eq("type", "prayer")
    .gte("sent_at", tenMinutesAgo)
    .contains("metadata", { prayer: prayerKey, offset })
    .limit(1);

  return data === null || data.length === 0;
}

// This endpoint should be called every 5 minutes by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("prayer-reminders");

  try {
    // Process any due scheduled messages first
    const scheduledResult = await processScheduledMessages(logger);
    if (scheduledResult.processed > 0) {
      setCronMetadata(logger, {
        scheduledMessages: {
          processed: scheduledResult.processed,
          successful: scheduledResult.successful,
          failed: scheduledResult.failed,
        },
      });
    }

    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques) {
      logCronError(logger, "Failed to fetch mosques", { error: mosqueError });
      finalizeCronLog(logger);
      return NextResponse.json(
        { error: "Failed to fetch mosques" },
        { status: 500 }
      );
    }

    setCronMetadata(logger, { mosqueCount: mosques.length });

    for (const mosque of mosques as Mosque[]) {
      // Get today's prayer times for this mosque (with caching)
      const prayerTimes = await getPrayerTimes(
        mosque.latitude,
        mosque.longitude,
        mosque.calculation_method,
        mosque.madhab,
        undefined, // Use today's date
        mosque.id  // Enable caching for this mosque
      );

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      // Convert Adhan times to Jamaat times
      // Jamaat = Adhan + 15 minutes (except Maghrib where Jamaat starts immediately)
      // This way reminders are based on when congregation actually prays
      const prayers = [
        { key: "fajr", name: "Fajr", time: getJamaatTime(prayerTimes.fajr, "fajr") },
        { key: "dhuhr", name: "Dhuhr", time: getJamaatTime(prayerTimes.dhuhr, "dhuhr") },
        { key: "asr", name: "Asr", time: getJamaatTime(prayerTimes.asr, "asr") },
        { key: "maghrib", name: "Maghrib", time: getJamaatTime(prayerTimes.maghrib, "maghrib") },
        { key: "isha", name: "Isha", time: getJamaatTime(prayerTimes.isha, "isha") },
      ];

      // Get subscribers for this mosque
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active");

      if (!subscribers || subscribers.length === 0) continue;

      for (const prayer of prayers) {
        // Get subscribers who want this prayer reminder
        // With simplified preferences, pref_daily_prayers covers all 5 prayers
        const eligibleSubscribers = (subscribers as Subscriber[]).filter((s) => {
          return s.pref_daily_prayers;
        });

        if (eligibleSubscribers.length === 0) continue;

        // Group by reminder offset and check if it's time
        const offsetGroups = new Map<number, Subscriber[]>();
        for (const sub of eligibleSubscribers) {
          const offset = sub.reminder_offset || 15;
          if (!offsetGroups.has(offset)) {
            offsetGroups.set(offset, []);
          }
          offsetGroups.get(offset)!.push(sub);
        }

        for (const [offset, subs] of offsetGroups) {
          if (isWithinMinutes(prayer.time, offset, mosque.timezone)) {
            // ATOMIC LOCK: Claim exclusive right to send this reminder
            // Uses database UNIQUE constraint - impossible to race
            const lockAcquired = await tryClaimReminderLock(
              mosque.id,
              prayer.key,
              offset
            );
            if (!lockAcquired) {
              continue; // Another cron run already claimed this - skip
            }

            // Template variables: prayer_name, prayer_time, mosque_name
            const templateVars = [prayer.name, prayer.time, mosque.name];

            // Send messages concurrently with p-limit (max 10 concurrent) using template
            const batchResult = await sendTemplatesConcurrently(
              subs,
              PRAYER_REMINDER_TEMPLATE,
              templateVars,
              logger
            );

            // Generate message content for logging (preview with actual values)
            const message = previewTemplate(PRAYER_REMINDER_TEMPLATE, templateVars);

            // Batch update last_message_at for successful sends
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);

            // Log the batch
            if (subs.length > 0) {
              const { error: msgError } = await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id,
                type: "prayer",
                content: message,
                sent_to_count: batchResult.successful,
                status: "sent",
                metadata: {
                  prayer: prayer.key,
                  offset,
                },
              });
              if (msgError) {
                console.error('[prayer-reminders] Failed to log message:', msgError.message, msgError.code, msgError.details);
                // Retry without metadata in case the column doesn't exist yet
                if (msgError.code === "PGRST204") {
                  const { error: retryError } = await supabaseAdmin.from("messages").insert({
                    mosque_id: mosque.id,
                    type: "prayer",
                    content: message,
                    sent_to_count: batchResult.successful,
                    status: "sent",
                  });
                  if (retryError) {
                    console.error('[prayer-reminders] Retry without metadata also failed:', retryError.message);
                  }
                }
              }
            }
          }
        }
      }
    }

    const result = finalizeCronLog(logger);

    return NextResponse.json({
      success: true,
      sent: result.messagesSent,
      durationMs: result.durationMs,
    });
  } catch (error) {
    logCronError(logger, "Unexpected error during cron execution", {
      error: error instanceof Error ? error.message : String(error),
    });
    finalizeCronLog(logger);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
