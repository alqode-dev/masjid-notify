import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMosquePrayerTimes, isWithinMinutes, isWithinMinutesAfter, isTimeWithinMinutesBefore, formatDbTime } from "@/lib/prayer-times";
import {
  SUHOOR_REMINDER_TEMPLATE,
  IFTAR_REMINDER_TEMPLATE,
  TARAWEEH_REMINDER_TEMPLATE,
  SUHOOR_PLANNING_TEMPLATE,
} from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
} from "@/lib/logger";
import {
  sendTemplatesConcurrently,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
} from "@/lib/message-sender";
import { previewTemplate } from "@/lib/whatsapp-templates";
import type { Mosque, Subscriber } from "@/lib/supabase";
import { TARAWEEH_REMINDER_MINUTES, SUHOOR_PLANNING_OFFSET_MINUTES } from "@/lib/constants";
import { tryClaimReminderLock } from "@/lib/reminder-locks";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// This should run every 5 minutes during Ramadan
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("ramadan-reminders");

  try {
    // Get mosques with Ramadan mode enabled
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq("ramadan_mode", true);

    if (mosqueError || !mosques || mosques.length === 0) {
      setCronMetadata(logger, { reason: "No mosques in Ramadan mode" });
      const result = finalizeCronLog(logger);
      return NextResponse.json({
        success: true,
        message: "No mosques in Ramadan mode",
        sent: 0,
        durationMs: result.durationMs,
      });
    }

    setCronMetadata(logger, { mosqueCount: mosques.length });

    for (const mosque of mosques as Mosque[]) {
      // Get prayer times for Suhoor (Fajr) and Iftar (Maghrib) - with caching
      const prayerTimes = await getMosquePrayerTimes(mosque);

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      // Get subscribers who want Ramadan reminders
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_ramadan", true);

      if (!subscribers || subscribers.length === 0) continue;

      // Check Suhoor reminder (before Fajr)
      if (
        isWithinMinutes(
          prayerTimes.fajr,
          mosque.suhoor_reminder_mins,
          mosque.timezone
        )
      ) {
        // ATOMIC LOCK: Claim exclusive right to send suhoor reminder
        const lockAcquired = await tryClaimReminderLock(mosque.id, "suhoor", 0, mosque.timezone);
        if (lockAcquired) {
          // Template variables: fajr_time, mosque_name
          const templateVars = [prayerTimes.fajr, mosque.name];

          // Send messages concurrently with p-limit (max 10 concurrent) using template
          const batchResult = await sendTemplatesConcurrently(
            subscribers as Subscriber[],
            SUHOOR_REMINDER_TEMPLATE,
            templateVars,
            logger
          );

          // Generate message content for logging (preview with actual values)
          const message = previewTemplate(SUHOOR_REMINDER_TEMPLATE, templateVars);

          // Batch update last_message_at for successful sends
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          const { error: suhoorMsgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "suhoor" },
          });
          if (suhoorMsgError) {
            console.error('[ramadan-reminders] Failed to log suhoor message:', suhoorMsgError.message, suhoorMsgError.code, suhoorMsgError.details);
          }
        }
      }

      // Check Iftar reminder (before Maghrib)
      if (
        isWithinMinutes(
          prayerTimes.maghrib,
          mosque.iftar_reminder_mins,
          mosque.timezone
        )
      ) {
        // ATOMIC LOCK: Claim exclusive right to send iftar reminder
        const lockAcquired = await tryClaimReminderLock(mosque.id, "iftar", 0, mosque.timezone);
        if (lockAcquired) {
          // Template variables: minutes_until, maghrib_time, mosque_name
          const templateVars = [
            String(mosque.iftar_reminder_mins),
            prayerTimes.maghrib,
            mosque.name,
          ];

          // Send messages concurrently with p-limit (max 10 concurrent) using template
          const batchResult = await sendTemplatesConcurrently(
            subscribers as Subscriber[],
            IFTAR_REMINDER_TEMPLATE,
            templateVars,
            logger
          );

          // Generate message content for logging (preview with actual values)
          const message = previewTemplate(IFTAR_REMINDER_TEMPLATE, templateVars);

          // Batch update last_message_at for successful sends
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          const { error: iftarMsgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "iftar" },
          });
          if (iftarMsgError) {
            console.error('[ramadan-reminders] Failed to log iftar message:', iftarMsgError.message, iftarMsgError.code, iftarMsgError.details);
          }
        }
      }

      // Check Taraweeh reminder (if taraweeh_time is set)
      if (mosque.taraweeh_time) {
        if (
          isTimeWithinMinutesBefore(
            mosque.taraweeh_time,
            TARAWEEH_REMINDER_MINUTES,
            mosque.timezone
          )
        ) {
          // ATOMIC LOCK: Claim exclusive right to send taraweeh reminder
          const lockAcquired = await tryClaimReminderLock(mosque.id, "taraweeh", 0, mosque.timezone);
          if (lockAcquired) {
            const formattedTime = formatDbTime(mosque.taraweeh_time);

            // Template variables: taraweeh_time, mosque_name
            const templateVars = [formattedTime, mosque.name];

            // Send messages concurrently with p-limit (max 10 concurrent) using template
            const batchResult = await sendTemplatesConcurrently(
              subscribers as Subscriber[],
              TARAWEEH_REMINDER_TEMPLATE,
              templateVars,
              logger
            );

            // Generate message content for logging (preview with actual values)
            const message = previewTemplate(TARAWEEH_REMINDER_TEMPLATE, templateVars);

            // Batch update last_message_at for successful sends
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);

            const { error: taraweehMsgError } = await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "ramadan",
              content: message,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "taraweeh" },
            });
            if (taraweehMsgError) {
              console.error('[ramadan-reminders] Failed to log taraweeh message:', taraweehMsgError.message, taraweehMsgError.code, taraweehMsgError.details);
            }
          }
        }

        // Also send suhoor planning reminder after Isha/Taraweeh
        // This helps people prepare for the next day's suhoor
        if (
          isWithinMinutesAfter(
            prayerTimes.isha,
            SUHOOR_PLANNING_OFFSET_MINUTES,
            mosque.timezone
          )
        ) {
          // ATOMIC LOCK: Claim exclusive right to send suhoor planning reminder
          const lockAcquired = await tryClaimReminderLock(mosque.id, "suhoor_planning", 0, mosque.timezone);
          if (lockAcquired) {
            // Get tomorrow's Fajr time
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowPrayerTimes = await getMosquePrayerTimes(mosque, tomorrow);

            if (tomorrowPrayerTimes) {
              // Template variables: fajr_time, mosque_name
              const templateVars = [tomorrowPrayerTimes.fajr, mosque.name];

              const batchResult = await sendTemplatesConcurrently(
                subscribers as Subscriber[],
                SUHOOR_PLANNING_TEMPLATE,
                templateVars,
                logger
              );

              const message = previewTemplate(SUHOOR_PLANNING_TEMPLATE, templateVars);

              const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
              await batchUpdateLastMessageAt(successfulIds);

              const { error: planningMsgError } = await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id,
                type: "ramadan",
                content: message,
                sent_to_count: batchResult.successful,
                status: "sent",
                metadata: { reminder_type: "suhoor_planning" },
              });
              if (planningMsgError) {
                console.error('[ramadan-reminders] Failed to log suhoor_planning message:', planningMsgError.message, planningMsgError.code, planningMsgError.details);
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
