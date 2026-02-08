import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getPrayerTimes,
  isWithinMinutes,
  isWithinMinutesAfter,
} from "@/lib/prayer-times";
import {
  TAHAJJUD_REMINDER_TEMPLATE,
  ISHRAQ_REMINDER_TEMPLATE,
  AWWABIN_REMINDER_TEMPLATE,
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
import {
  TAHAJJUD_MINUTES_BEFORE_FAJR,
  ISHRAQ_MINUTES_AFTER_SUNRISE,
  AWWABIN_MINUTES_AFTER_MAGHRIB
} from "@/lib/constants";
import { tryClaimReminderLock } from "@/lib/reminder-locks";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// This should run every 5 minutes to check for nafl prayer times
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("nafl-reminders");

  try {
    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques || mosques.length === 0) {
      setCronMetadata(logger, { reason: "No mosques found" });
      const result = finalizeCronLog(logger);
      return NextResponse.json({
        success: true,
        message: "No mosques found",
        sent: 0,
        durationMs: result.durationMs,
      });
    }

    setCronMetadata(logger, { mosqueCount: mosques.length });

    for (const mosque of mosques as Mosque[]) {
      // Get prayer times for today (with caching)
      const prayerTimes = await getPrayerTimes(
        mosque.latitude,
        mosque.longitude,
        mosque.calculation_method,
        mosque.madhab,
        undefined, // Use today's date
        mosque.id // Enable caching for this mosque
      );

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      // Get subscribers who want nafl salah reminders
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_nafl_salahs", true);

      if (!subscribers || subscribers.length === 0) continue;

      // Check Tahajjud reminder (2 hours before Fajr)
      if (isWithinMinutes(prayerTimes.fajr, TAHAJJUD_MINUTES_BEFORE_FAJR, mosque.timezone)) {
        // ATOMIC LOCK: Claim exclusive right to send this reminder
        const lockAcquired = await tryClaimReminderLock(mosque.id, "tahajjud", 0);
        if (lockAcquired) {
          // Template variables: fajr_time, mosque_name
          const templateVars = [prayerTimes.fajr, mosque.name];

          const batchResult = await sendTemplatesConcurrently(
            subscribers as Subscriber[],
            TAHAJJUD_REMINDER_TEMPLATE,
            templateVars,
            logger
          );

          const message = previewTemplate(TAHAJJUD_REMINDER_TEMPLATE, templateVars);

          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "nafl",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "tahajjud" },
          });
          if (msgError) {
            console.error('[nafl-reminders] Failed to log tahajjud message:', msgError.message, msgError.code, msgError.details);
            if (msgError.code === "PGRST204") {
              await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id, type: "nafl", content: message,
                sent_to_count: batchResult.successful, status: "sent",
              });
            }
          }
        }
      }

      // Check Ishraq reminder (20 minutes after Sunrise)
      if (isWithinMinutesAfter(prayerTimes.sunrise, ISHRAQ_MINUTES_AFTER_SUNRISE, mosque.timezone)) {
        // ATOMIC LOCK: Claim exclusive right to send this reminder
        const lockAcquired = await tryClaimReminderLock(mosque.id, "ishraq", 0);
        if (lockAcquired) {
          // Template variables: mosque_name
          const templateVars = [mosque.name];

          const batchResult = await sendTemplatesConcurrently(
            subscribers as Subscriber[],
            ISHRAQ_REMINDER_TEMPLATE,
            templateVars,
            logger
          );

          const message = previewTemplate(ISHRAQ_REMINDER_TEMPLATE, templateVars);

          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          const { error: ishraqMsgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "nafl",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "ishraq" },
          });
          if (ishraqMsgError) {
            console.error('[nafl-reminders] Failed to log ishraq message:', ishraqMsgError.message, ishraqMsgError.code, ishraqMsgError.details);
            if (ishraqMsgError.code === "PGRST204") {
              await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id, type: "nafl", content: message,
                sent_to_count: batchResult.successful, status: "sent",
              });
            }
          }
        }
      }

      // Check Awwabin reminder (15 minutes after Maghrib)
      if (isWithinMinutesAfter(prayerTimes.maghrib, AWWABIN_MINUTES_AFTER_MAGHRIB, mosque.timezone)) {
        // ATOMIC LOCK: Claim exclusive right to send this reminder
        const lockAcquired = await tryClaimReminderLock(mosque.id, "awwabin", 0);
        if (lockAcquired) {
          // Template variables: mosque_name
          const templateVars = [mosque.name];

          const batchResult = await sendTemplatesConcurrently(
            subscribers as Subscriber[],
            AWWABIN_REMINDER_TEMPLATE,
            templateVars,
            logger
          );

          const message = previewTemplate(AWWABIN_REMINDER_TEMPLATE, templateVars);

          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);

          const { error: awwabinMsgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "nafl",
            content: message,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "awwabin" },
          });
          if (awwabinMsgError) {
            console.error('[nafl-reminders] Failed to log awwabin message:', awwabinMsgError.message, awwabinMsgError.code, awwabinMsgError.details);
            if (awwabinMsgError.code === "PGRST204") {
              await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id, type: "nafl", content: message,
                sent_to_count: batchResult.successful, status: "sent",
              });
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
