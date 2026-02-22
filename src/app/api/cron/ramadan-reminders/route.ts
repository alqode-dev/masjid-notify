import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMosquePrayerTimes, isWithinMinutes, isWithinMinutesAfter, isTimeWithinMinutesBefore, formatDbTime } from "@/lib/prayer-times";
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
import { TARAWEEH_REMINDER_MINUTES, SUHOOR_PLANNING_OFFSET_MINUTES } from "@/lib/constants";
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

  const logger = createCronLogger("ramadan-reminders");

  try {
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
        .eq("pref_ramadan", true);

      if (!subscribers || subscribers.length === 0) continue;

      // Suhoor reminder (before Fajr)
      if (isWithinMinutes(prayerTimes.fajr, mosque.suhoor_reminder_mins, mosque.timezone)) {
        const lockAcquired = await tryClaimReminderLock(mosque.id, "suhoor", 0, mosque.timezone);
        if (lockAcquired) {
          const suhoorInspiration = getInspirationMessage("suhoor", mosque.timezone);
          const payload = {
            title: "Suhoor Reminder",
            body: `Fajr at ${formatTime12h(prayerTimes.fajr)} — Finish your suhoor${suhoorInspiration ? ` | ${suhoorInspiration}` : ""}`,
            icon: "/icon-192x192.png",
            tag: "suhoor",
            url: "/",
          };

          const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);
          await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "ramadan");

          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: payload.body,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "suhoor" },
          });
          if (msgError) console.error('[ramadan-reminders] Failed to log suhoor message:', msgError.message);
        }
      }

      // Iftar reminder (before Maghrib)
      if (isWithinMinutes(prayerTimes.maghrib, mosque.iftar_reminder_mins, mosque.timezone)) {
        const lockAcquired = await tryClaimReminderLock(mosque.id, "iftar", 0, mosque.timezone);
        if (lockAcquired) {
          const iftarInspiration = getInspirationMessage("iftar", mosque.timezone);
          const payload = {
            title: "Iftar Reminder",
            body: `${mosque.iftar_reminder_mins} min until Iftar at ${formatTime12h(prayerTimes.maghrib)}${iftarInspiration ? ` — ${iftarInspiration}` : ""}`,
            icon: "/icon-192x192.png",
            tag: "iftar",
            url: "/",
          };

          const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
          const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
          await batchUpdateLastMessageAt(successfulIds);
          await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "ramadan");

          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: payload.body,
            sent_to_count: batchResult.successful,
            status: "sent",
            metadata: { reminder_type: "iftar" },
          });
          if (msgError) console.error('[ramadan-reminders] Failed to log iftar message:', msgError.message);
        }
      }

      // Taraweeh reminder
      if (mosque.taraweeh_time) {
        if (isTimeWithinMinutesBefore(mosque.taraweeh_time, TARAWEEH_REMINDER_MINUTES, mosque.timezone)) {
          const lockAcquired = await tryClaimReminderLock(mosque.id, "taraweeh", 0, mosque.timezone);
          if (lockAcquired) {
            const formattedTime = formatDbTime(mosque.taraweeh_time);
            const taraweehInspiration = getInspirationMessage("taraweeh", mosque.timezone);
            const payload = {
              title: "Taraweeh Reminder",
              body: `Taraweeh at ${formattedTime}${taraweehInspiration ? ` — ${taraweehInspiration}` : ""}`,
              icon: "/icon-192x192.png",
              tag: "taraweeh",
              url: "/",
            };

            const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
            const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
            await batchUpdateLastMessageAt(successfulIds);
            await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "ramadan");

            const { error: msgError } = await supabaseAdmin.from("messages").insert({
              mosque_id: mosque.id,
              type: "ramadan",
              content: payload.body,
              sent_to_count: batchResult.successful,
              status: "sent",
              metadata: { reminder_type: "taraweeh" },
            });
            if (msgError) console.error('[ramadan-reminders] Failed to log taraweeh message:', msgError.message);
          }
        }

        // Suhoor planning reminder after Isha
        if (isWithinMinutesAfter(prayerTimes.isha, SUHOOR_PLANNING_OFFSET_MINUTES, mosque.timezone)) {
          const lockAcquired = await tryClaimReminderLock(mosque.id, "suhoor_planning", 0, mosque.timezone);
          if (lockAcquired) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowPrayerTimes = await getMosquePrayerTimes(mosque, tomorrow);

            if (tomorrowPrayerTimes) {
              const planningInspiration = getInspirationMessage("suhoor_planning", mosque.timezone);
              const payload = {
                title: "Suhoor Planning",
                body: `Tomorrow's Fajr at ${formatTime12h(tomorrowPrayerTimes.fajr)}${planningInspiration ? ` — ${planningInspiration}` : ""}`,
                icon: "/icon-192x192.png",
                tag: "suhoor-planning",
                url: "/",
              };

              const batchResult = await sendPushNotificationsBatch(subscribers as Subscriber[], payload, logger);
              const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
              await batchUpdateLastMessageAt(successfulIds);
              await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "ramadan");

              const { error: msgError } = await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id,
                type: "ramadan",
                content: payload.body,
                sent_to_count: batchResult.successful,
                status: "sent",
                metadata: { reminder_type: "suhoor_planning" },
              });
              if (msgError) console.error('[ramadan-reminders] Failed to log suhoor_planning message:', msgError.message);
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
