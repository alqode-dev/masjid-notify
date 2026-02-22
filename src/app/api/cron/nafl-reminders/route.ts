import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getMosquePrayerTimes,
  isWithinMinutes,
  isWithinMinutesAfter,
} from "@/lib/prayer-times";
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
import type { Mosque, Subscriber } from "@/lib/supabase";
import {
  TAHAJJUD_MINUTES_BEFORE_FAJR,
  ISHRAQ_MINUTES_AFTER_SUNRISE,
  AWWABIN_MINUTES_AFTER_MAGHRIB
} from "@/lib/constants";
import { tryClaimReminderLock } from "@/lib/reminder-locks";
import { formatTime12h } from "@/lib/utils";
import { getInspirationMessage } from "@/lib/prayer-messages";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("nafl-reminders");

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

    for (const mosque of mosques as Mosque[]) {
      const prayerTimes = await getMosquePrayerTimes(mosque);

      if (!prayerTimes) {
        logCronError(logger, "Failed to get prayer times", {
          mosqueId: mosque.id,
          mosqueName: mosque.name,
        });
        continue;
      }

      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_nafl_salahs", true);

      if (!subscribers || subscribers.length === 0) {
        console.log(`[nafl-reminders] No active nafl subscribers for ${mosque.name}`);
        continue;
      }

      console.log(`[nafl-reminders] ${mosque.name}: ${subscribers.length} nafl subscribers, fajr=${prayerTimes.fajr}, sunrise=${prayerTimes.sunrise}, maghrib=${prayerTimes.maghrib}`);

      // Tahajjud (2 hours before Fajr)
      try {
        if (isWithinMinutes(prayerTimes.fajr, TAHAJJUD_MINUTES_BEFORE_FAJR, mosque.timezone)) {
          const lockAcquired = await tryClaimReminderLock(mosque.id, "tahajjud", 0, mosque.timezone);
          if (lockAcquired) {
            const tahajjudInspiration = getInspirationMessage("tahajjud", mosque.timezone);
            const payload = {
              title: "Tahajjud Reminder",
              body: `Wake up for Tahajjud — Fajr at ${formatTime12h(prayerTimes.fajr)}${tahajjudInspiration ? ` | ${tahajjudInspiration}` : ""}`,
              icon: "/icon-192x192.png",
              tag: "tahajjud",
              url: "/",
            };

            const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);
            await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "nafl");

            const { error: msgError } = await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "nafl",
              content: payload.body,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "tahajjud" },
            });
            if (msgError) console.error('[nafl-reminders] Failed to log tahajjud message:', msgError.message);
            console.log(`[nafl-reminders] Tahajjud sent to ${batchResult.successful}/${batchResult.total} subscribers at ${mosque.name}`);
          }
        }
      } catch (err) {
        console.error("[nafl-reminders] Tahajjud block failed:", err instanceof Error ? err.message : String(err));
      }

      // Ishraq (after Sunrise)
      try {
        if (isWithinMinutesAfter(prayerTimes.sunrise, ISHRAQ_MINUTES_AFTER_SUNRISE, mosque.timezone)) {
          const lockAcquired = await tryClaimReminderLock(mosque.id, "ishraq", 0, mosque.timezone);
          if (lockAcquired) {
            const ishraqInspiration = getInspirationMessage("ishraq", mosque.timezone);
            const payload = {
              title: "Ishraq Reminder",
              body: `Time for Ishraq prayer${ishraqInspiration ? ` — ${ishraqInspiration}` : ""}`,
              icon: "/icon-192x192.png",
              tag: "ishraq",
              url: "/",
            };

            const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);
            await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "nafl");

            const { error: msgError } = await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "nafl",
              content: payload.body,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "ishraq" },
            });
            if (msgError) console.error('[nafl-reminders] Failed to log ishraq message:', msgError.message);
            console.log(`[nafl-reminders] Ishraq sent to ${batchResult.successful}/${batchResult.total} subscribers at ${mosque.name}`);
          }
        }
      } catch (err) {
        console.error("[nafl-reminders] Ishraq block failed:", err instanceof Error ? err.message : String(err));
      }

      // Awwabin (after Maghrib)
      try {
        if (isWithinMinutesAfter(prayerTimes.maghrib, AWWABIN_MINUTES_AFTER_MAGHRIB, mosque.timezone)) {
          const lockAcquired = await tryClaimReminderLock(mosque.id, "awwabin", 0, mosque.timezone);
          if (lockAcquired) {
            const awwabinInspiration = getInspirationMessage("awwabin", mosque.timezone);
            const payload = {
              title: "Awwabin Reminder",
              body: `Time for Awwabin prayer${awwabinInspiration ? ` — ${awwabinInspiration}` : ""}`,
              icon: "/icon-192x192.png",
              tag: "awwabin",
              url: "/",
            };

            const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);
            await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "nafl");

            const { error: msgError } = await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "nafl",
              content: payload.body,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "awwabin" },
            });
            if (msgError) console.error('[nafl-reminders] Failed to log awwabin message:', msgError.message);
            console.log(`[nafl-reminders] Awwabin sent to ${batchResult.successful}/${batchResult.total} subscribers at ${mosque.name}`);
          }
        }
      } catch (err) {
        console.error("[nafl-reminders] Awwabin block failed:", err instanceof Error ? err.message : String(err));
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
