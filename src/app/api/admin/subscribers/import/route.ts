import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { normalizePhoneNumber, isValidSAPhoneNumber } from "@/lib/utils";

const MAX_IMPORT_SIZE = 500;
const BATCH_SIZE = 50;

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const { subscribers } = await request.json();

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers provided" },
        { status: 400 }
      );
    }

    if (subscribers.length > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `Import limited to ${MAX_IMPORT_SIZE} subscribers at a time` },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Validate and prepare all records first
    const validRecords: Array<{
      phone_number: string;
      mosque_id: string;
      status: string;
      pref_daily_prayers: boolean;
      pref_jumuah: boolean;
      pref_ramadan: boolean;
      pref_hadith: boolean;
      pref_announcements: boolean;
      pref_nafl_salahs: boolean;
      reminder_offset: number;
    }> = [];

    for (const subscriber of subscribers) {
      const phoneRaw = typeof subscriber.phone_number === "string" ? subscriber.phone_number : "";
      if (!phoneRaw || !isValidSAPhoneNumber(phoneRaw)) {
        skipped++;
        continue;
      }
      const normalizedPhone = normalizePhoneNumber(phoneRaw);

      validRecords.push({
        phone_number: normalizedPhone,
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
    }

    // Insert in batches to avoid timeouts
    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batch = validRecords.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabaseAdmin
        .from("subscribers")
        .upsert(batch, {
          onConflict: "phone_number,mosque_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        console.error("Batch import error:", error.message);
        errors += batch.length;
      } else {
        const insertedCount = data?.length ?? 0;
        imported += insertedCount;
        skipped += batch.length - insertedCount;
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
