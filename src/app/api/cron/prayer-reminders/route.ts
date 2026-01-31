import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes, isWithinMinutes } from "@/lib/prayer-times";
import { sendWhatsAppMessage, getPrayerReminderMessage } from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import type { Mosque, Subscriber } from "@/lib/supabase";

// This endpoint should be called every 5 minutes by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques) {
      console.error("Error fetching mosques:", mosqueError);
      return NextResponse.json(
        { error: "Failed to fetch mosques" },
        { status: 500 }
      );
    }

    let totalSent = 0;

    for (const mosque of mosques as Mosque[]) {
      // Get today's prayer times for this mosque
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
            const message = getPrayerReminderMessage(
              prayer.name,
              prayer.time,
              mosque.name
            );

            for (const sub of subs) {
              const result = await sendWhatsAppMessage(
                sub.phone_number,
                message
              );

              if (result.success) {
                totalSent++;

                // Update last_message_at
                await supabaseAdmin
                  .from("subscribers")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", sub.id);
              }
            }

            // Log the batch
            if (subs.length > 0) {
              await supabaseAdmin.from("messages").insert({
                mosque_id: mosque.id,
                type: "prayer",
                content: message,
                sent_to_count: totalSent,
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

    return NextResponse.json({
      success: true,
      sent: totalSent,
    });
  } catch (error) {
    console.error("Prayer reminder cron error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
