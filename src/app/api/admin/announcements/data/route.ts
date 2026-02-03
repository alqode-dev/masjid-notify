import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    // Get mosque
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("id, name")
      .eq("id", admin.mosque_id)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
    }

    // Get active subscriber count
    const { count: activeCount } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("mosque_id", admin.mosque_id)
      .eq("status", "active");

    // Get recent announcements
    const { data: recentAnnouncements } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("mosque_id", admin.mosque_id)
      .eq("type", "announcement")
      .order("sent_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      mosque,
      activeCount: activeCount || 0,
      recentAnnouncements: recentAnnouncements || [],
    });
  } catch (error) {
    console.error("Error fetching announcements data:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements data" },
      { status: 500 }
    );
  }
});
