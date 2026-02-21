import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const subscriberId = request.nextUrl.searchParams.get("subscriberId");

  if (!subscriberId) {
    return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .select("id, status, pause_until, pref_daily_prayers, pref_jumuah, pref_ramadan, pref_nafl_salahs, pref_hadith, pref_announcements, reminder_offset")
    .eq("id", subscriberId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, ...updates } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
    }

    // Build update object from allowed fields only
    const allowedFields = [
      "pref_daily_prayers", "pref_jumuah", "pref_ramadan",
      "pref_nafl_salahs", "pref_hadith", "pref_announcements",
      "reminder_offset", "status", "pause_until",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update(updateData)
      .eq("id", subscriberId);

    if (error) {
      console.error("[settings] Failed to update:", error.message);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[settings] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
