import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

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

    const {
      calculation_method,
      madhab,
      jumuah_adhaan_time,
      jumuah_khutbah_time,
      ramadan_mode,
      suhoor_reminder_mins,
      iftar_reminder_mins,
      taraweeh_time,
    } = body;

    const { error } = await supabaseAdmin
      .from("mosques")
      .update({
        calculation_method,
        madhab,
        jumuah_adhaan_time,
        jumuah_khutbah_time,
        ramadan_mode,
        suhoor_reminder_mins,
        iftar_reminder_mins,
        taraweeh_time,
      })
      .eq("id", admin.mosque_id);

    if (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
});
