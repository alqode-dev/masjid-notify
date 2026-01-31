import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes, isWithinMinutes, isTimeWithinMinutesBefore, formatDbTime } from "@/lib/prayer-times";
import {
  sendWhatsAppMessage,
  getSuhoorReminderMessage,
  getIftarReminderMessage,
  getTaraweehReminderMessage,
} from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import type { Mosque, Subscriber } from "@/lib/supabase";

// This should run every 5 minutes during Ramadan
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get mosques with Ramadan mode enabled
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq("ramadan_mode", true);

    if (mosqueError || !mosques || mosques.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No mosques in Ramadan mode",
        sent: 0,
      });
    }

    let totalSent = 0;

    for (const mosque of mosques as Mosque[]) {
      // Get prayer times for Suhoor (Fajr) and Iftar (Maghrib)
      const prayerTimes = await getPrayerTimes(
        mosque.latitude,
        mosque.longitude,
        mosque.calculation_method,
        mosque.madhab
      );

      if (!prayerTimes) {
        console.error(`Failed to get prayer times for ${mosque.name}`);
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
        const message = getSuhoorReminderMessage(
          prayerTimes.fajr,
          mosque.name
        );

        let sentCount = 0;
        for (const sub of subscribers as Subscriber[]) {
          const result = await sendWhatsAppMessage(sub.phone_number, message);
          if (result.success) {
            sentCount++;
            totalSent++;

            await supabaseAdmin
              .from("subscribers")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", sub.id);
          }
        }

        await supabaseAdmin.from("messages").insert({
          mosque_id: mosque.id,
          type: "ramadan",
          content: message,
          sent_to_count: sentCount,
          status: "sent",
          metadata: { reminder_type: "suhoor" },
        });
      }

      // Check Iftar reminder (before Maghrib)
      if (
        isWithinMinutes(
          prayerTimes.maghrib,
          mosque.iftar_reminder_mins,
          mosque.timezone
        )
      ) {
        const message = getIftarReminderMessage(
          prayerTimes.maghrib,
          mosque.iftar_reminder_mins,
          mosque.name
        );

        let sentCount = 0;
        for (const sub of subscribers as Subscriber[]) {
          const result = await sendWhatsAppMessage(sub.phone_number, message);
          if (result.success) {
            sentCount++;
            totalSent++;

            await supabaseAdmin
              .from("subscribers")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", sub.id);
          }
        }

        await supabaseAdmin.from("messages").insert({
          mosque_id: mosque.id,
          type: "ramadan",
          content: message,
          sent_to_count: sentCount,
          status: "sent",
          metadata: { reminder_type: "iftar" },
        });
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
          const formattedTime = formatDbTime(mosque.taraweeh_time);
          const message = getTaraweehReminderMessage(formattedTime, mosque.name);

          let sentCount = 0;
          for (const sub of subscribers as Subscriber[]) {
            const result = await sendWhatsAppMessage(sub.phone_number, message);
            if (result.success) {
              sentCount++;
              totalSent++;

              await supabaseAdmin
                .from("subscribers")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", sub.id);
            }
          }

          await supabaseAdmin.from("messages").insert({
            mosque_id: mosque.id,
            type: "ramadan",
            content: message,
            sent_to_count: sentCount,
            status: "sent",
            metadata: { reminder_type: "taraweeh" },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
    });
  } catch (error) {
    console.error("Ramadan reminder cron error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
