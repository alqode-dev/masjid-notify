import { NextResponse } from "next/server";
import { supabaseAdmin, type Subscriber } from "@/lib/supabase";
import { ANNOUNCEMENT_TEMPLATE } from "@/lib/whatsapp";
import { withAdminAuth } from "@/lib/auth";
import { sendTemplatesConcurrently } from "@/lib/message-sender";

const MAX_CONTENT_LENGTH = 4096;

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { mosque_id, content } = body;

    if (!mosque_id || !content) {
      return NextResponse.json(
        { error: "Mosque ID and content are required" },
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

    // Get active subscribers with announcements preference
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("mosque_id", mosque_id)
      .eq("status", "active")
      .eq("pref_announcements", true);

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

    // Template variables: mosque_name, announcement_content
    const templateVars = [mosque.name, content];

    // Send to all subscribers concurrently (with p-limit for rate limiting)
    const batchResult = await sendTemplatesConcurrently(
      subscribers as Subscriber[],
      ANNOUNCEMENT_TEMPLATE,
      templateVars
    );

    const successCount = batchResult.successful;
    const failCount = batchResult.failed;

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
});
