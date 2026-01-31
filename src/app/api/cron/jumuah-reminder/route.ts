import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage, getJumuahReminderMessage } from "@/lib/whatsapp";
import { isFriday, formatTime12h } from "@/lib/utils";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  incrementMessageCount,
  setCronMetadata,
  finalizeCronLog,
} from "@/lib/logger";
import type { Mosque, Subscriber } from "@/lib/supabase";

// This should run every Friday morning (e.g., 10:00 AM)
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("jumuah-reminder");

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
      // Check if it's Friday in the mosque's timezone
      if (!isFriday(mosque.timezone)) continue;

      // Get subscribers who want Jumu'ah reminders
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_jumuah", true);

      if (!subscribers || subscribers.length === 0) continue;

      const message = getJumuahReminderMessage(
        formatTime12h(mosque.jumuah_adhaan_time),
        formatTime12h(mosque.jumuah_khutbah_time),
        mosque.name
      );

      let sentCount = 0;

      for (const sub of subscribers as Subscriber[]) {
        const result = await sendWhatsAppMessage(sub.phone_number, message);
        if (result.success) {
          sentCount++;
          incrementMessageCount(logger);

          await supabaseAdmin
            .from("subscribers")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", sub.id);
        }
      }

      // Log the message
      await supabaseAdmin.from("messages").insert({
        mosque_id: mosque.id,
        type: "jumuah",
        content: message,
        sent_to_count: sentCount,
        status: "sent",
      });
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
