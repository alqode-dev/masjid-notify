import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    // Get mosque info using admin's mosque_id for security
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("id, name")
      .eq("id", admin.mosque_id)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: "Mosque not found" },
        { status: 404 }
      );
    }

    // Get subscriber counts using admin's mosque_id
    const { count: totalSubscribers } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", admin.mosque_id);

    const { count: activeSubscribers } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", admin.mosque_id)
      .eq("status", "active");

    // Get message counts using admin's mosque_id
    const { data: totalMessagesData } = await supabaseAdmin
      .from("messages")
      .select("sent_to_count")
      .eq("mosque_id", admin.mosque_id);

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
      .eq("mosque_id", admin.mosque_id)
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
