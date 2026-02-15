import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

/**
 * Invalidate prayer times cache when settings that affect calculations change.
 * This ensures the next cron run will fetch fresh prayer times from the API.
 */
async function invalidatePrayerCache(mosqueId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("prayer_times_cache")
    .delete()
    .eq("mosque_id", mosqueId);

  if (error) {
    console.warn("Failed to invalidate prayer cache:", error.message);
    // Non-critical - cache will naturally expire after the day passes
  } else {
    console.log("Prayer cache invalidated for mosque:", mosqueId);
  }
}

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    const { data: mosque, error } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq("id", admin.mosque_id)
      .single();

    if (error || !mosque) {
      return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
    }

    return NextResponse.json({ mosque });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();

    // Always-available fields
    const coreUpdate: Record<string, unknown> = {
      calculation_method: body.calculation_method,
      madhab: body.madhab,
      jumuah_adhaan_time: body.jumuah_adhaan_time,
      jumuah_khutbah_time: body.jumuah_khutbah_time,
    };

    // Ramadan fields (may not exist in DB yet — migration 007 required)
    const ramadanFields: Record<string, unknown> = {
      ramadan_mode: body.ramadan_mode,
      suhoor_reminder_mins: body.suhoor_reminder_mins,
      iftar_reminder_mins: body.iftar_reminder_mins,
      taraweeh_time: body.taraweeh_time,
    };

    // Validate custom prayer times when method is 99 (Custom / Masjid Times)
    if (body.calculation_method === 99) {
      const cpt = body.custom_prayer_times;
      if (!cpt || !cpt.fajr || !cpt.sunrise || !cpt.dhuhr || !cpt.asr || !cpt.maghrib || !cpt.isha) {
        return NextResponse.json(
          { error: "All 6 prayer times are required when using Custom / Masjid Times mode" },
          { status: 400 }
        );
      }
    }

    // Eid + custom prayer times fields (migration 013)
    const extendedFields: Record<string, unknown> = {
      eid_mode: body.eid_mode ?? "off",
      eid_khutbah_time: body.eid_khutbah_time ?? null,
      eid_salah_time: body.eid_salah_time ?? null,
      custom_prayer_times: body.custom_prayer_times ?? null,
    };

    // Mutual exclusion: Eid and Ramadan can't both be active
    if (extendedFields.eid_mode !== "off") {
      ramadanFields.ramadan_mode = false;
    }
    if (ramadanFields.ramadan_mode === true) {
      extendedFields.eid_mode = "off";
    }

    // Try saving all fields first
    const { error } = await supabaseAdmin
      .from("mosques")
      .update({ ...coreUpdate, ...ramadanFields, ...extendedFields })
      .eq("id", admin.mosque_id);

    if (error) {
      // If Ramadan columns don't exist, retry with core fields only
      // Check for PostgreSQL error codes: 42703 (undefined column), 42P01 (undefined table)
      // or PGRST204 (column not found in schema cache)
      const isColumnMissing =
        error.code === "42703" ||
        error.code === "PGRST204" ||
        (error.message && (error.message.includes("column") || error.message.includes("schema cache")));

      if (isColumnMissing) {
        console.warn("Ramadan columns missing — saving core settings only. Run migration 007.", error.code, error.message);
        const { error: coreError } = await supabaseAdmin
          .from("mosques")
          .update(coreUpdate)
          .eq("id", admin.mosque_id);

        if (coreError) {
          console.error("Error updating core settings:", coreError);
          return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
          );
        }

        // Invalidate prayer cache since calculation settings may have changed
        await invalidatePrayerCache(admin.mosque_id);

        return NextResponse.json({
          success: true,
          warning: "Prayer settings saved. Ramadan settings require a database migration — run migration 007 in Supabase SQL Editor.",
        });
      }

      console.error("Error updating settings:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    // Invalidate prayer cache since calculation_method or madhab may have changed
    // This ensures next cron run uses fresh prayer times from Aladhan API
    await invalidatePrayerCache(admin.mosque_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
});
