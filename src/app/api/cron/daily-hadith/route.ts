import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DAILY_HADITH_TEMPLATE } from "@/lib/whatsapp";
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
import { getTodaysHadith } from "@/lib/hadith-api";
import { getMosquePrayerTimes, isWithinMinutesAfter } from "@/lib/prayer-times";
import type { Mosque, Subscriber } from "@/lib/supabase";
import { tryClaimReminderLock, ReminderType } from "@/lib/reminder-locks";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// How many minutes after Fajr/Maghrib to send the hadith
const HADITH_MINUTES_AFTER_PRAYER = 15;

/**
 * Daily Hadith Cron Job
 *
 * This should run every 5 minutes (like prayer-reminders).
 * It automatically sends hadith based on prayer times:
 * - Morning hadith: 15 minutes after Fajr
 * - Evening hadith: 15 minutes after Maghrib
 *
 * This way hadith timing always follows the actual prayer times,
 * which change throughout the year.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("daily-hadith");

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

    let totalSent = 0;

    for (const mosque of mosques as Mosque[]) {
      // Get prayer times for this mosque (with caching)
      const prayerTimes = await getMosquePrayerTimes(mosque);

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times for hadith", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      const morningMatch = isWithinMinutesAfter(prayerTimes.fajr, HADITH_MINUTES_AFTER_PRAYER, mosque.timezone);
      const eveningMatch = isWithinMinutesAfter(prayerTimes.maghrib, HADITH_MINUTES_AFTER_PRAYER, mosque.timezone);
      console.log(`[daily-hadith] ${mosque.name}: fajr=${prayerTimes.fajr} morningMatch=${morningMatch}, maghrib=${prayerTimes.maghrib} eveningMatch=${eveningMatch}`);

      // Check if it's time for morning hadith (15 minutes after Fajr)
      if (morningMatch) {
        const sent = await sendHadithIfNotAlreadySent(mosque, "morning", logger);
        totalSent += sent;
      }

      // Check if it's time for evening hadith (15 minutes after Maghrib)
      if (eveningMatch) {
        const sent = await sendHadithIfNotAlreadySent(mosque, "evening", logger);
        totalSent += sent;
      }
    }

    const result = finalizeCronLog(logger);

    return NextResponse.json({
      success: true,
      sent: totalSent,
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

/**
 * Send hadith to subscribers if not already sent today
 */
async function sendHadithIfNotAlreadySent(
  mosque: Mosque,
  timeOfDay: "morning" | "evening",
  logger: ReturnType<typeof createCronLogger>
): Promise<number> {
  // ATOMIC LOCK: Claim exclusive right to send hadith for this mosque today
  const lockKey: ReminderType = timeOfDay === "morning" ? "hadith_morning" : "hadith_evening";
  const lockAcquired = await tryClaimReminderLock(mosque.id, lockKey, 0, mosque.timezone);
  if (!lockAcquired) {
    // Another cron run already sent hadith for this mosque today
    return 0;
  }

  // Get today's hadith from the external API
  const hadith = await getTodaysHadith(timeOfDay);

  if (!hadith) {
    logCronError(logger, `Failed to fetch ${timeOfDay} hadith from external API`, {
      mosqueId: mosque.id,
    });
    return 0;
  }

  // Get subscribers who want daily hadith
  const { data: subscribers } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .eq("mosque_id", mosque.id)
    .eq("status", "active")
    .eq("pref_hadith", true);

  if (!subscribers || subscribers.length === 0) {
    return 0;
  }

  // Template variables: hadith_text, source_and_reference, mosque_name
  const templateVars = [
    hadith.textEnglish,
    `${hadith.source}, Hadith ${hadith.reference}`,
    mosque.name,
  ];

  // Send messages concurrently with p-limit (max 10 concurrent) using template
  const batchResult = await sendTemplatesConcurrently(
    subscribers as Subscriber[],
    DAILY_HADITH_TEMPLATE,
    templateVars,
    logger
  );

  // Generate message content for logging (preview with actual values)
  const message = previewTemplate(DAILY_HADITH_TEMPLATE, templateVars);

  // Batch update last_message_at for successful sends
  const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
  await batchUpdateLastMessageAt(successfulIds);

  // Log the message with error handling
  const { error: msgError } = await supabaseAdmin.from("messages").insert({
    mosque_id: mosque.id,
    type: "hadith",
    content: message,
    sent_to_count: batchResult.successful,
    status: "sent",
    metadata: {
      time_of_day: timeOfDay,
      hadith_collection: hadith.collection,
      hadith_number: hadith.hadithNumber,
      hadith_source: hadith.source,
      hadith_reference: hadith.reference,
    },
  });
  if (msgError) {
    console.error('[daily-hadith] Failed to log message:', msgError.message, msgError.code, msgError.details);
  }

  console.log(`[daily-hadith] Sent ${timeOfDay} hadith to ${batchResult.successful} subscribers at ${mosque.name}`);

  return batchResult.successful;
}
