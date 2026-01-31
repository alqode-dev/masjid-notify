import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes, isWithinMinutes, isTimeWithinMinutesBefore, formatDbTime } from "@/lib/prayer-times";
import {
  getSuhoorReminderMessage,
  getIftarReminderMessage,
  getTaraweehReminderMessage,
} from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
} from "@/lib/logger";
import {
  sendMessagesConcurrently,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
} from "@/lib/message-sender";
import type { Mosque, Subscriber } from "@/lib/supabase";

// Check if a ramadan reminder was already sent recently (within last 10 minutes)
// This prevents duplicates when the 5-minute window overlaps with consecutive cron runs
async function wasRamadanReminderSent(
  mosqueId: string,
  reminderType: string
): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("mosque_id", mosqueId)
    .eq("type", "ramadan")
    .gte("sent_at", tenMinutesAgo)
    .contains("metadata", { reminder_type: reminderType })
    .limit(1);

  return data !== null && data.length > 0;
}

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
        // Check if already sent to prevent duplicates
        const alreadySent = await wasRamadanReminderSent(mosque.id, "suhoor");
        if (!alreadySent) {
          const message = getSuhoorReminderMessage(
            prayerTimes.fajr,
            mosque.name
          );

          // Send messages concurrently with p-limit (max 10 concurrent)
          const batchResult = await sendMessagesConcurrently(
            subscribers as Subscriber[],
            message,
            logger
          );

          // Batch update last_message_at for successful sends
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "suhoor" },
          });
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
        // Check if already sent to prevent duplicates
        const alreadySent = await wasRamadanReminderSent(mosque.id, "iftar");
        if (!alreadySent) {
          const message = getIftarReminderMessage(
            prayerTimes.maghrib,
            mosque.iftar_reminder_mins,
            mosque.name
          );

          // Send messages concurrently with p-limit (max 10 concurrent)
          const batchResult = await sendMessagesConcurrently(
            subscribers as Subscriber[],
            message,
            logger
          );

          // Batch update last_message_at for successful sends
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "iftar" },
          });
        }
      }

      // Check Taraweeh reminder (if taraweeh_time is set)
      if (mosque.taraweeh_time) {
        // Send reminder 30 minutes before Taraweeh
        const taraweehReminderMins = 30;
        if (
          isTimeWithinMinutesBefore(
            mosque.taraweeh_time,
            taraweehReminderMins,
            mosque.timezone
          )
        ) {
          // Check if already sent to prevent duplicates
          const alreadySent = await wasRamadanReminderSent(mosque.id, "taraweeh");
          if (!alreadySent) {
            const formattedTime = formatDbTime(mosque.taraweeh_time);
            const message = getTaraweehReminderMessage(formattedTime, mosque.name);

            // Send messages concurrently with p-limit (max 10 concurrent)
            const batchResult = await sendMessagesConcurrently(
              subscribers as Subscriber[],
              message,
              logger
            );

            // Batch update last_message_at for successful sends
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);

            await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "ramadan",
              content: message,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "taraweeh" },
            });
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
