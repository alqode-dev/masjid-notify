import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSubscribeRateLimiter, getClientIP } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const limiter = getSubscribeRateLimiter();
  if (limiter) {
    const ip = getClientIP(request);
    const { success } = await limiter.limit(`notifications:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const subscriberId = request.nextUrl.searchParams.get("subscriberId");

  if (!subscriberId) {
    return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
  }

  const countOnly = request.nextUrl.searchParams.get("countOnly");
  if (countOnly === "true") {
    const { count, error: countError } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("subscriber_id", subscriberId)
      .eq("read", false);

    if (countError) {
      return NextResponse.json({ error: "Failed to count" }, { status: 500 });
    }
    return NextResponse.json({ unreadCount: count || 0 });
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
  const patchLimiter = getSubscribeRateLimiter();
  if (patchLimiter) {
    const ip = getClientIP(request);
    const { success } = await patchLimiter.limit(`notifications:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

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
