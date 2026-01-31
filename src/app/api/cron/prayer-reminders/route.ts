import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes, isWithinMinutes } from "@/lib/prayer-times";
import { getPrayerReminderMessage } from "@/lib/whatsapp";
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

// Check if a prayer reminder was already sent recently (within last 10 minutes)
// This prevents duplicates when the 5-minute window overlaps with consecutive cron runs
async function wasRecentlySent(
  mosqueId: string,
  prayer: string,
  offset: number
): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("mosque_id", mosqueId)
    .eq("type", "prayer")
    .gte("sent_at", tenMinutesAgo)
    .contains("metadata", { prayer, offset })
    .limit(1);

  return data !== null && data.length > 0;
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
      // Get today's prayer times for this mosque
      const prayerTimes = await getPrayerTimes(
        mosque.latitude,
        mosque.longitude,
        mosque.calculation_method,
        mosque.madhab
      );

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      const prayers = [
        { key: "fajr", name: "Fajr", time: prayerTimes.fajr },
        { key: "dhuhr", name: "Dhuhr", time: prayerTimes.dhuhr },
        { key: "asr", name: "Asr", time: prayerTimes.asr },
        { key: "maghrib", name: "Maghrib", time: prayerTimes.maghrib },
        { key: "isha", name: "Isha", time: prayerTimes.isha },
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
        const eligibleSubscribers = (subscribers as Subscriber[]).filter((s) => {
          // Check if they want all prayers or specifically Fajr
          if (prayer.key === "fajr") {
            return s.pref_fajr || s.pref_all_prayers;
          }
          return s.pref_all_prayers;
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
            // Check if this reminder was already sent recently to prevent duplicates
            // This is needed because the 5-minute window may overlap with consecutive cron runs
            const alreadySent = await wasRecentlySent(
              mosque.id,
              prayer.key,
              offset
            );
            if (alreadySent) {
              continue; // Skip - already sent this reminder
            }

            const message = getPrayerReminderMessage(
              prayer.name,
              prayer.time,
              mosque.name
            );

            // Send messages concurrently with p-limit (max 10 concurrent)
            const batchResult = await sendMessagesConcurrently(
              subs,
              message,
              logger
            );

            // Batch update last_message_at for successful sends
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);

            // Log the batch
            if (subs.length > 0) {
              await supabaseAdmin.from("messages").insert({
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
