import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isFriday, formatTime12h } from "@/lib/utils";
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
import { tryClaimReminderLock } from "@/lib/reminder-locks";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("jumuah-reminder");

  try {
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
      if (!isFriday(mosque.timezone)) continue;

      const lockAcquired = await tryClaimReminderLock(mosque.id, "jumuah", 0, mosque.timezone);
      if (!lockAcquired) continue;

      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_jumuah", true);

      if (!subscribers || subscribers.length === 0) continue;

      const payload = {
        title: "Jumu'ah Reminder",
        body: `Khutbah at ${formatTime12h(mosque.jumuah_khutbah_time)} | Adhaan at ${formatTime12h(mosque.jumuah_adhaan_time)} - ${mosque.name}`,
        icon: "/icon-192x192.png",
        tag: "jumuah",
        url: "/",
      };

      const batchResult = await sendPushNotificationsBatch(
        subscribers as Subscriber[],
        payload,
        logger
      );

      const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
      await batchUpdateLastMessageAt(successfulIds);

      await storeNotifications(subscribers as Subscriber[], payload, mosque.id, "jumuah");

      const { error: msgError } = await supabaseAdmin.from("messages").insert({
        mosque_id: mosque.id,
        type: "jumuah",
        content: payload.body,
        sent_to_count: batchResult.successful,
        status: "sent",
      });
      if (msgError) {
        console.error('[jumuah-reminder] Failed to log message:', msgError.message, msgError.code, msgError.details);
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
