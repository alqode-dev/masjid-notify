import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    // Get mosque info
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("id, name")
      .eq("slug", DEFAULT_MOSQUE_SLUG)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: "Mosque not found" },
        { status: 404 }
      );
    }

    // Get subscriber counts
    const { count: totalSubscribers } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", mosque.id);

    const { count: activeSubscribers } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", mosque.id)
      .eq("status", "active");

    // Get message counts
    const { data: totalMessagesData } = await supabaseAdmin
      .from("messages")
      .select("sent_to_count")
      .eq("mosque_id", mosque.id);

    const totalMessages =
      totalMessagesData?.reduce(
        (sum, msg) => sum + (msg.sent_to_count || 0),
        0
      ) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayMessagesData } = await supabaseAdmin
      .from("messages")
      .select("sent_to_count")
      .eq("mosque_id", mosque.id)
      .gte("sent_at", today.toISOString());

    const todayMessages =
      todayMessagesData?.reduce(
        (sum, msg) => sum + (msg.sent_to_count || 0),
        0
      ) || 0;

    return NextResponse.json({
      mosqueName: mosque.name,
      totalSubscribers: totalSubscribers || 0,
      activeSubscribers: activeSubscribers || 0,
      totalMessages,
      todayMessages,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
});
