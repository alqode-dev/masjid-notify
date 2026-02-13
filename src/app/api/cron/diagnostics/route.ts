import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getMosquePrayerTimes,
  isWithinMinutes,
  isWithinMinutesAfter,
  getJamaatTime,
  calculateNaflTimes,
} from "@/lib/prayer-times";
import { verifyCronSecret } from "@/lib/auth";
import type { Mosque } from "@/lib/supabase";
import {
  CRON_WINDOW_MINUTES,
  TAHAJJUD_MINUTES_BEFORE_FAJR,
  ISHRAQ_MINUTES_AFTER_SUNRISE,
  AWWABIN_MINUTES_AFTER_MAGHRIB,
  VALID_REMINDER_OFFSETS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint for debugging cron reminder issues.
 * Shows the complete state of the reminder system at the current moment.
 * Protected by CRON_SECRET - same auth as cron jobs.
 *
 * Call this at any time to see:
 * - Current times (UTC + mosque timezone)
 * - Today's prayer times and jamaat times
 * - Which reminders would fire RIGHT NOW
 * - Locks claimed today
 * - Subscriber counts
 * - Recent messages sent
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques || mosques.length === 0) {
      return NextResponse.json({ error: "No mosques found", details: mosqueError }, { status: 500 });
    }

    const diagnostics = [];

    for (const mosque of mosques as Mosque[]) {
      // Current time info
      const now = new Date();
      const tzFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: mosque.timezone,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
        hourCycle: "h23",
      });
      const dateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: mosque.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const localTime = tzFormatter.format(now);
      const localDate = dateFormatter.format(now);

      // Prayer times
      const prayerTimes = await getMosquePrayerTimes(mosque);

      if (!prayerTimes) {
        diagnostics.push({
          mosque: mosque.name,
          error: "Failed to fetch prayer times",
        });
        continue;
      }

      // Jamaat times
      const jamaatTimes = {
        fajr: getJamaatTime(prayerTimes.fajr, "fajr"),
        dhuhr: getJamaatTime(prayerTimes.dhuhr, "dhuhr"),
        asr: getJamaatTime(prayerTimes.asr, "asr"),
        maghrib: getJamaatTime(prayerTimes.maghrib, "maghrib"),
        isha: getJamaatTime(prayerTimes.isha, "isha"),
      };

      // Nafl times
      const naflTimes = calculateNaflTimes(prayerTimes);

      // Check which reminders would fire RIGHT NOW
      const prayerChecks: Record<string, Record<string, boolean>> = {};
      const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
      for (const key of prayerKeys) {
        prayerChecks[key] = {};
        for (const offset of VALID_REMINDER_OFFSETS) {
          prayerChecks[key][`offset_${offset}`] = isWithinMinutes(
            jamaatTimes[key],
            offset,
            mosque.timezone
          );
        }
      }

      const naflChecks = {
        tahajjud: isWithinMinutes(prayerTimes.fajr, TAHAJJUD_MINUTES_BEFORE_FAJR, mosque.timezone),
        ishraq: isWithinMinutesAfter(prayerTimes.sunrise, ISHRAQ_MINUTES_AFTER_SUNRISE, mosque.timezone),
        awwabin: isWithinMinutesAfter(prayerTimes.maghrib, AWWABIN_MINUTES_AFTER_MAGHRIB, mosque.timezone),
      };

      const hadithChecks = {
        morning: isWithinMinutesAfter(prayerTimes.fajr, 15, mosque.timezone),
        evening: isWithinMinutesAfter(prayerTimes.maghrib, 15, mosque.timezone),
      };

      // Subscriber counts
      const { count: totalActive } = await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("status", "active");

      const { count: dailyPrayers } = await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_daily_prayers", true);

      const { count: naflSalahs } = await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_nafl_salahs", true);

      const { count: hadithPref } = await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_hadith", true);

      const { count: jumuahPref } = await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_jumuah", true);

      // Today's locks
      const { data: todayLocks } = await supabaseAdmin
        .from("prayer_reminder_locks")
        .select("prayer_key, reminder_offset, claimed_at")
        .eq("mosque_id", mosque.id)
        .eq("reminder_date", localDate)
        .order("claimed_at", { ascending: true });

      // Recent messages (last 10)
      const { data: recentMessages } = await supabaseAdmin
        .from("messages")
        .select("type, content, sent_to_count, sent_at, status, metadata")
        .eq("mosque_id", mosque.id)
        .order("sent_at", { ascending: false })
        .limit(10);

      diagnostics.push({
        mosque: mosque.name,
        mosqueId: mosque.id,
        timezone: mosque.timezone,
        ramadanMode: mosque.ramadan_mode,
        currentTime: {
          utc: now.toISOString(),
          local: `${localDate} ${localTime}`,
          cronWindowMinutes: CRON_WINDOW_MINUTES,
        },
        prayerTimes: {
          fajr: prayerTimes.fajr,
          sunrise: prayerTimes.sunrise,
          dhuhr: prayerTimes.dhuhr,
          asr: prayerTimes.asr,
          maghrib: prayerTimes.maghrib,
          isha: prayerTimes.isha,
        },
        jamaatTimes,
        naflTimes,
        wouldFireNow: {
          prayers: prayerChecks,
          nafl: naflChecks,
          hadith: hadithChecks,
        },
        subscribers: {
          totalActive,
          dailyPrayers,
          naflSalahs,
          hadith: hadithPref,
          jumuah: jumuahPref,
        },
        locksClaimedToday: todayLocks || [],
        recentMessages: (recentMessages || []).map((m) => ({
          type: m.type,
          status: m.status,
          sentToCount: m.sent_to_count,
          sentAt: m.sent_at,
          metadata: m.metadata,
          contentPreview: m.content?.substring(0, 80) + (m.content?.length > 80 ? "..." : ""),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      diagnostics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
