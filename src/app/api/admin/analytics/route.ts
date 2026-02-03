import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

const MESSAGE_TYPE_COLORS: Record<string, string> = {
  prayer: "#0d9488",
  hadith: "#f59e0b",
  announcement: "#8b5cf6",
  ramadan: "#ec4899",
  welcome: "#10b981",
  jumuah: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  paused: "#f59e0b",
  unsubscribed: "#ef4444",
};

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch subscribers from last 30 days
    const { data: subscribers } = await supabaseAdmin
      .from("subscribers")
      .select("subscribed_at")
      .eq("mosque_id", admin.mosque_id)
      .gte("subscribed_at", thirtyDaysAgo.toISOString())
      .order("subscribed_at", { ascending: true });

    // Get count before 30 days
    const { count: priorCount } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", admin.mosque_id)
      .lt("subscribed_at", thirtyDaysAgo.toISOString());

    // Generate all dates in range
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      dates.push(date.toISOString().split("T")[0]);
    }

    // Count subscribers per date
    const dateCountMap = new Map<string, number>();
    subscribers?.forEach((sub) => {
      const date = new Date(sub.subscribed_at).toISOString().split("T")[0];
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    });

    // Build cumulative data
    let cumulativeCount = priorCount || 0;
    const subscriberGrowth = dates.map((date) => {
      cumulativeCount += dateCountMap.get(date) || 0;
      return {
        date: new Date(date).toLocaleDateString("en-ZA", {
          month: "short",
          day: "numeric",
        }),
        count: cumulativeCount,
      };
    });

    // Fetch message types breakdown
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("type, sent_to_count")
      .eq("mosque_id", admin.mosque_id);

    const typeCounts = new Map<string, number>();
    messages?.forEach((msg) => {
      const count = msg.sent_to_count || 0;
      typeCounts.set(msg.type, (typeCounts.get(msg.type) || 0) + count);
    });

    const messageTypes = Array.from(typeCounts.entries()).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: MESSAGE_TYPE_COLORS[name] || "#6b7280",
      })
    );

    // Fetch status breakdown
    const statusCounts: Record<string, number> = {
      active: 0,
      paused: 0,
      unsubscribed: 0,
    };

    const { data: allSubscribers } = await supabaseAdmin
      .from("subscribers")
      .select("status")
      .eq("mosque_id", admin.mosque_id);

    allSubscribers?.forEach((sub) => {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name] || "#6b7280",
      }));

    return NextResponse.json({
      subscriberGrowth,
      messageTypes,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
});
