import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMosquePrayerTimes, isWithinMinutes, getJamaatTime } from "@/lib/prayer-times";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
  CronLogContext,
} from "@/lib/logger";
import {
  sendPushNotificationsBatch,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
  storeNotifications,
} from "@/lib/push-sender";
import type { Mosque, Subscriber, ScheduledMessage } from "@/lib/supabase";
import { tryClaimReminderLock, cleanupOldLocks, type ReminderType } from "@/lib/reminder-locks";
import { formatTime12h } from "@/lib/utils";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// Maximum retry attempts before marking a scheduled message as permanently failed
const MAX_SCHEDULED_MESSAGE_RETRIES = 5;

// Process scheduled messages that are due for sending.
// Runs AFTER core prayer reminders to avoid blocking the primary function.
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
      const { data: mosque } = await supabaseAdmin
        .from("mosques")
        .select("name")
        .eq("id", scheduled.mosque_id)
        .maybeSingle();

      const mosqueName = mosque?.name || "Mosque";

      // Get active subscribers for this mosque who opted in to announcements
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", scheduled.mosque_id)
        .eq("status", "active")
        .eq("pref_announcements", true);

      if (!subscribers || subscribers.length === 0) {
        await supabaseAdmin
          .from("scheduled_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", scheduled.id);
        successful++;
        continue;
      }

      const payload = {
        title: `${mosqueName} Announcement`,
        body: scheduled.content,
        icon: "/icon-192x192.png",
        tag: `announcement-${scheduled.id}`,
        url: "/notifications",
      };

      const batchResult = await sendPushNotificationsBatch(
        subscribers as Subscriber[],
        payload,
        logger
      );

      const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
      await batchUpdateLastMessageAt(successfulIds);

      // Store in-app notifications
      await storeNotifications(subscribers as Subscriber[], payload, scheduled.mosque_id, "announcement");

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
      }

      await supabaseAdmin
        .from("scheduled_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", scheduled.id);

      successful++;
    } catch (err) {
      const currentRetries = ((scheduled.retry_count as number) || 0) + 1;

      logCronError(logger, "Failed to process scheduled message", {
        scheduledMessageId: scheduled.id,
        mosqueId: scheduled.mosque_id,
        retryCount: currentRetries,
        maxRetries: MAX_SCHEDULED_MESSAGE_RETRIES,
        error: err instanceof Error ? err.message : String(err),
      });

      if (currentRetries >= MAX_SCHEDULED_MESSAGE_RETRIES) {
        await supabaseAdmin
          .from("scheduled_messages")
          .update({ status: "failed", retry_count: currentRetries })
          .eq("id", scheduled.id);
      } else {
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

// Auto-resume subscribers whose pause period has expired.
async function autoResumeSubscribers(logger: CronLogContext): Promise<void> {
  const { data: resumed, error: resumeError } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "active", pause_until: null })
    .eq("status", "paused")
    .lte("pause_until", new Date().toISOString())
    .select("id");

  if (resumeError) {
    logCronError(logger, "Failed to auto-resume paused subscribers", { error: resumeError });
  } else if (resumed && resumed.length > 0) {
    setCronMetadata(logger, { autoResumed: resumed.length });
  }
}

// This endpoint should be called every 5 minutes by cron-job.org
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("prayer-reminders");

  try {
    // =========================================================
    // CORE: Prayer Reminders — this MUST run, it's the primary function
    // =========================================================

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
      const prayerTimes = await getMosquePrayerTimes(mosque);

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      const prayers = [
        { key: "fajr", name: "Fajr", time: getJamaatTime(prayerTimes.fajr, "fajr") },
        { key: "dhuhr", name: "Dhuhr", time: getJamaatTime(prayerTimes.dhuhr, "dhuhr") },
        { key: "asr", name: "Asr", time: getJamaatTime(prayerTimes.asr, "asr") },
        { key: "maghrib", name: "Maghrib", time: getJamaatTime(prayerTimes.maghrib, "maghrib") },
        { key: "isha", name: "Isha", time: getJamaatTime(prayerTimes.isha, "isha") },
      ];

      console.log(`[prayer-reminders] ${mosque.name} prayer times:`, {
        fajr: prayerTimes.fajr,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
        jamaatTimes: prayers.map(p => `${p.name}=${p.time}`).join(', '),
      });

      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active");

      if (!subscribers || subscribers.length === 0) {
        console.log(`[prayer-reminders] No active subscribers for ${mosque.name}`);
        continue;
      }

      console.log(`[prayer-reminders] ${subscribers.length} active subscribers for ${mosque.name}`);

      for (const prayer of prayers) {
        const eligibleSubscribers = (subscribers as Subscriber[]).filter((s) => {
          return s.pref_daily_prayers;
        });

        if (eligibleSubscribers.length === 0) continue;

        const offsetGroups = new Map<number, Subscriber[]>();
        for (const sub of eligibleSubscribers) {
          const offset = sub.reminder_offset || 15;
          if (!offsetGroups.has(offset)) {
            offsetGroups.set(offset, []);
          }
          offsetGroups.get(offset)!.push(sub);
        }

        for (const [offset, subs] of offsetGroups) {
          const timeMatch = isWithinMinutes(prayer.time, offset, mosque.timezone);
          console.log(`[prayer-reminders] ${prayer.name} offset=${offset}: jamaat=${prayer.time}, match=${timeMatch}`);

          if (timeMatch) {
            const lockAcquired = await tryClaimReminderLock(
              mosque.id,
              prayer.key as ReminderType,
              offset,
              mosque.timezone
            );
            if (!lockAcquired) {
              console.log(`[prayer-reminders] Lock already claimed for ${prayer.name} offset=${offset}`);
              continue;
            }

            console.log(`[prayer-reminders] Sending ${prayer.name} reminder to ${subs.length} subscribers`);

            const payload = {
              title: `${prayer.name} Prayer`,
              body: `${formatTime12h(prayer.time)} at ${mosque.name}`,
              icon: "/icon-192x192.png",
              tag: `prayer-${prayer.key}`,
              url: "/",
            };

            const batchResult = await sendPushNotificationsBatch(
              subs,
              payload,
              logger
            );

            console.log(`[prayer-reminders] ${prayer.name} result: ${batchResult.successful}/${batchResult.total} sent, ${batchResult.failed} failed`);

            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);

            // Store in-app notifications
            await storeNotifications(subs, payload, mosque.id, "prayer");

            if (subs.length > 0) {
              const { error: msgError } = await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id,
                type: "prayer",
                content: `${prayer.name} Prayer - ${formatTime12h(prayer.time)} at ${mosque.name}`,
                sent_to_count: batchResult.successful,
                status: "sent",
                metadata: {
                  prayer: prayer.key,
                  offset,
                },
              });
              if (msgError) {
                console.error('[prayer-reminders] Failed to log message:', msgError.message, msgError.code, msgError.details);
              }
            }
          }
        }
      }
    }

    // =========================================================
    // AUXILIARY: These run AFTER prayer reminders, in isolated try-catches.
    // =========================================================

    try {
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
    } catch (err) {
      console.error("[prayer-reminders] processScheduledMessages failed:", err instanceof Error ? err.message : String(err));
    }

    try {
      await autoResumeSubscribers(logger);
    } catch (err) {
      console.error("[prayer-reminders] autoResumeSubscribers failed:", err instanceof Error ? err.message : String(err));
    }

    try {
      const firstMosque = mosques[0] as Mosque | undefined;
      await cleanupOldLocks(2, firstMosque?.timezone);
    } catch (err) {
      console.error("[prayer-reminders] cleanupOldLocks failed:", err instanceof Error ? err.message : String(err));
    }

    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      const { error: cacheCleanErr } = await supabaseAdmin
        .from("prayer_times_cache")
        .delete()
        .lt("date", cutoffStr);
      if (cacheCleanErr) {
        console.error("[prayer-reminders] prayer cache cleanup failed:", cacheCleanErr.message);
      }
    } catch (err) {
      console.error("[prayer-reminders] prayer cache cleanup failed:", err instanceof Error ? err.message : String(err));
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
