import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const { subscribers } = await request.json();

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers provided" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const subscriber of subscribers) {
      try {
        const { error } = await supabaseAdmin.from("subscribers").insert({
          phone_number: subscriber.phone_number,
          mosque_id: admin.mosque_id,
          status: "active",
          pref_daily_prayers: subscriber.pref_daily_prayers ?? true,
          pref_jumuah: subscriber.pref_jumuah ?? true,
          pref_ramadan: subscriber.pref_ramadan ?? true,
          pref_hadith: subscriber.pref_hadith ?? true,
          pref_announcements: subscriber.pref_announcements ?? true,
          pref_nafl_salahs: subscriber.pref_nafl_salahs ?? true,
          reminder_offset: subscriber.reminder_offset ?? 15,
        });

        if (error) {
          if (error.code === "23505") {
            skipped++;
          } else {
            errors++;
          }
        } else {
          imported++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Error importing subscribers:", error);
    return NextResponse.json(
      { error: "Failed to import subscribers" },
      { status: 500 }
    );
  }
});
