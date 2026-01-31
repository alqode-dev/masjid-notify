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
        pref_fajr,
        pref_all_prayers,
        pref_jumuah,
        pref_programs,
        pref_hadith,
        pref_ramadan,
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
      pref_fajr: subscriber.pref_fajr,
      pref_all_prayers: subscriber.pref_all_prayers,
      pref_jumuah: subscriber.pref_jumuah,
      pref_programs: subscriber.pref_programs,
      pref_hadith: subscriber.pref_hadith,
      pref_ramadan: subscriber.pref_ramadan,
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
      pref_fajr,
      pref_all_prayers,
      pref_jumuah,
      pref_programs,
      pref_hadith,
      pref_ramadan,
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

    // Update subscriber preferences
    const { error: updateError } = await supabaseAdmin
      .from("subscribers")
      .update({
        reminder_offset: reminder_offset ?? 15,
        pref_fajr: pref_fajr ?? true,
        pref_all_prayers: pref_all_prayers ?? false,
        pref_jumuah: pref_jumuah ?? true,
        pref_programs: pref_programs ?? true,
        pref_hadith: pref_hadith ?? false,
        pref_ramadan: pref_ramadan ?? true,
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
