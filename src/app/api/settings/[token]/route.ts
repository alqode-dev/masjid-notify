import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET: Validate token and return subscriber preferences
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;

    if (!token || token.length !== 32) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Look up subscriber by settings token
    const { data: subscriber, error } = await supabaseAdmin
      .from("subscribers")
      .select(
        `
        id,
        reminder_offset,
        pref_daily_prayers,
        pref_jumuah,
        pref_ramadan,
        pref_nafl_salahs,
        pref_hadith,
        pref_announcements,
        settings_token_expires
      `
      )
      .eq("settings_token", token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(subscriber.settings_token_expires);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired. Please send SETTINGS to get a new link." },
        { status: 410 }
      );
    }

    // Return preferences (without sensitive data)
    return NextResponse.json({
      reminder_offset: subscriber.reminder_offset,
      pref_daily_prayers: subscriber.pref_daily_prayers,
      pref_jumuah: subscriber.pref_jumuah,
      pref_ramadan: subscriber.pref_ramadan,
      pref_nafl_salahs: subscriber.pref_nafl_salahs,
      pref_hadith: subscriber.pref_hadith,
      pref_announcements: subscriber.pref_announcements,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update subscriber preferences
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;

    if (!token || token.length !== 32) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const {
      reminder_offset,
      pref_daily_prayers,
      pref_jumuah,
      pref_ramadan,
      pref_nafl_salahs,
      pref_hadith,
      pref_announcements,
    } = body;

    // Look up subscriber by settings token
    const { data: subscriber, error: lookupError } = await supabaseAdmin
      .from("subscribers")
      .select("id, settings_token_expires")
      .eq("settings_token", token)
      .single();

    if (lookupError || !subscriber) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(subscriber.settings_token_expires);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired. Please send SETTINGS to get a new link." },
        { status: 410 }
      );
    }

    // Validate reminder_offset (must be one of 5, 10, 15, 30)
    const validOffsets = [5, 10, 15, 30];
    if (reminder_offset !== undefined && !validOffsets.includes(reminder_offset)) {
      return NextResponse.json(
        { error: "Invalid reminder offset" },
        { status: 400 }
      );
    }

    // Validate boolean preferences (must be boolean if provided)
    const booleanPrefs = {
      pref_daily_prayers,
      pref_jumuah,
      pref_ramadan,
      pref_nafl_salahs,
      pref_hadith,
      pref_announcements,
    };

    for (const [key, value] of Object.entries(booleanPrefs)) {
      if (value !== undefined && typeof value !== "boolean") {
        return NextResponse.json(
          { error: `Invalid value for ${key}: must be a boolean` },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields (don't reset unspecified prefs to defaults)
    const updateData: Record<string, unknown> = {};
    if (reminder_offset !== undefined) updateData.reminder_offset = reminder_offset;
    if (pref_daily_prayers !== undefined) updateData.pref_daily_prayers = pref_daily_prayers;
    if (pref_jumuah !== undefined) updateData.pref_jumuah = pref_jumuah;
    if (pref_ramadan !== undefined) updateData.pref_ramadan = pref_ramadan;
    if (pref_nafl_salahs !== undefined) updateData.pref_nafl_salahs = pref_nafl_salahs;
    if (pref_hadith !== undefined) updateData.pref_hadith = pref_hadith;
    if (pref_announcements !== undefined) updateData.pref_announcements = pref_announcements;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Update subscriber preferences and invalidate the token (one-time use)
    const { error: updateError } = await supabaseAdmin
      .from("subscribers")
      .update({
        ...updateData,
        settings_token: null,
        settings_token_expires: null,
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Settings update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
