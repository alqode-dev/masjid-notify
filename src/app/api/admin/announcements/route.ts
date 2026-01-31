import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage, getAnnouncementMessage } from "@/lib/whatsapp";
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
    const { mosque_id, content } = body;

    if (!mosque_id || !content) {
      return NextResponse.json(
        { error: "Mosque ID and content are required" },
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

    // Get mosque name
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("name")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: "Mosque not found" },
        { status: 404 }
      );
    }

    // Get active subscribers with programs preference
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from("subscribers")
      .select("phone_number")
      .eq("mosque_id", mosque_id)
      .eq("status", "active")
      .eq("pref_programs", true);

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers to send to" },
        { status: 400 }
      );
    }

    const message = getAnnouncementMessage(content, mosque.name);
    let successCount = 0;
    let failCount = 0;

    // Send to all subscribers
    for (const subscriber of subscribers) {
      const result = await sendWhatsAppMessage(subscriber.phone_number, message);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(
          `Failed to send to ${subscriber.phone_number}:`,
          result.error
        );
      }
    }

    // Log the message
    await supabaseAdmin.from("messages").insert({
      mosque_id,
      type: "announcement",
      content,
      sent_to_count: successCount,
      status: failCount === subscribers.length ? "failed" : "sent",
      metadata: {
        total_attempted: subscribers.length,
        success_count: successCount,
        fail_count: failCount,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount: failCount,
    });
  } catch (error) {
    console.error("Announcement API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
