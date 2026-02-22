import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { mosque_id, content, scheduled_at } = body;

    if (!mosque_id || !content || !scheduled_at) {
      return NextResponse.json(
        { error: "Mosque ID, content, and scheduled_at are required" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be a string of ${MAX_CONTENT_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    // Verify admin has access to this mosque
    if (admin.mosque_id !== mosque_id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have access to this mosque" },
        { status: 403 }
      );
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    const now = new Date();
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= now) {
      return NextResponse.json(
        { error: "Scheduled time must be a valid date in the future" },
        { status: 400 }
      );
    }

    // Insert scheduled message
    const { data, error } = await supabaseAdmin
      .from("scheduled_messages")
      .insert({
        mosque_id,
        content,
        scheduled_at,
        status: "pending",
        created_by: admin.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error scheduling message:", error);
      return NextResponse.json(
        { error: "Failed to schedule message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data,
    });
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});

// GET - List pending scheduled messages for the mosque
export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    // Get pending scheduled messages for this mosque
    const { data, error } = await supabaseAdmin
      .from("scheduled_messages")
      .select("*")
      .eq("mosque_id", admin.mosque_id)
      .eq("status", "pending")
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch scheduled messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: data || [],
    });
  } catch (error) {
    console.error("Scheduled messages GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
