import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { mosque_id, content, scheduled_at } = body;

    if (!mosque_id || !content || !scheduled_at) {
      return NextResponse.json(
        { error: "Mosque ID, content, and scheduled_at are required" },
        { status: 400 }
      );
    }

    // Verify admin has access to this mosque
    if (authResult.admin.mosque_id !== mosque_id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have access to this mosque" },
        { status: 403 }
      );
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    const now = new Date();
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
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
        created_by: authResult.admin.user_id,
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
}

// GET - List pending scheduled messages for the mosque
export async function GET() {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get pending scheduled messages for this mosque
    const { data, error } = await supabaseAdmin
      .from("scheduled_messages")
      .select("*")
      .eq("mosque_id", authResult.admin.mosque_id)
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
}
