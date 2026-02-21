import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
} from "@/lib/logger";
import {
  sendPushNotificationsBatch,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
  storeNotifications,
} from "@/lib/push-sender";
import { getTodaysHadith } from "@/lib/hadith-api";
import { getMosquePrayerTimes, isWithinMinutesAfter } from "@/lib/prayer-times";
import type { Mosque, Subscriber } from "@/lib/supabase";
import { tryClaimReminderLock, ReminderType } from "@/lib/reminder-locks";
import { HADITH_MINUTES_AFTER_PRAYER } from "@/lib/constants";
import { truncate } from "@/lib/utils";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("daily-hadith");

  try {
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

      if (morningMatch) {
        const sent = await sendHadithIfNotAlreadySent(mosque, "morning", logger);
        totalSent += sent;
      }

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

async function sendHadithIfNotAlreadySent(
  mosque: Mosque,
  timeOfDay: "morning" | "evening",
  logger: ReturnType<typeof createCronLogger>
): Promise<number> {
  const lockKey: ReminderType = timeOfDay === "morning" ? "hadith_morning" : "hadith_evening";
  const lockAcquired = await tryClaimReminderLock(mosque.id, lockKey, 0, mosque.timezone);
  if (!lockAcquired) return 0;

  const hadith = await getTodaysHadith(timeOfDay, mosque.timezone);

  if (!hadith) {
    logCronError(logger, `Failed to fetch ${timeOfDay} hadith from external API`, {
      mosqueId: mosque.id,
    });
    return 0;
  }

  const { data: subscribers } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .eq("mosque_id", mosque.id)
    .eq("status", "active")
    .eq("pref_hadith", true);

  if (!subscribers || subscribers.length === 0) return 0;

  const sourceRef = `${hadith.source}, Hadith ${hadith.reference}`;
  const payload = {
    title: "Daily Hadith",
    body: truncate(hadith.textEnglish, 200),
    icon: "/icon-192x192.png",
    tag: `hadith-${timeOfDay}`,
    url: "/notifications",
    data: {
      fullText: hadith.textEnglish,
      source: sourceRef,
      arabic: hadith.textArabic,
    },
  };

  const batchResult = await sendPushNotificationsBatch(
    subscribers as Subscriber[],
    payload,
    logger
  );

  const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
  await batchUpdateLastMessageAt(successfulIds);

  await storeNotifications(subscribers as Subscriber[], {
    ...payload,
    body: hadith.textEnglish, // Store full text in notifications table
  }, mosque.id, "hadith");

  const { error: msgError } = await supabaseAdmin.from("messages").insert({
    mosque_id: mosque.id,
    type: "hadith",
    content: `${hadith.textEnglish}\n\n— ${sourceRef}`,
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
