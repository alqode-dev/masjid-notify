import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const subscriberId = request.nextUrl.searchParams.get("subscriberId");

  if (!subscriberId) {
    return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, data, read, created_at")
    .eq("subscriber_id", subscriberId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[notifications] Failed to fetch:", error.message);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }

  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: NextRequest) {
  try {
    const { subscriberId, notificationId, markAll } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
    }

    if (markAll) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("subscriber_id", subscriberId)
        .eq("read", false);

      if (error) {
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
      }
    } else if (notificationId) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("subscriber_id", subscriberId);

      if (error) {
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[notifications] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
