import { NextResponse } from "next/server";
import { supabaseAdmin, type Subscriber } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { sendPushNotificationsBatch, storeNotifications } from "@/lib/push-sender";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";
import type { MessageAttachment } from "@/lib/supabase";

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { mosque_id, content, attachments: rawAttachments } = body;

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

    // Validate attachments
    let attachments: MessageAttachment[] | null = null;
    if (rawAttachments && Array.isArray(rawAttachments)) {
      if (rawAttachments.length > 5) {
        return NextResponse.json(
          { error: "Maximum 5 attachments allowed" },
          { status: 400 }
        );
      }
      attachments = rawAttachments as MessageAttachment[];
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

    const payload = {
      title: `${mosque.name} Announcement`,
      body: content,
      icon: "/icon-192x192.png",
      tag: `announcement-${Date.now()}`,
      url: "/announcements",
      data: attachments ? { attachments } : undefined,
    };

    const batchResult = await sendPushNotificationsBatch(
      subscribers as Subscriber[],
      payload
    );

    // Store in-app notifications
    await storeNotifications(subscribers as Subscriber[], payload, mosque_id, "announcement");

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
      attachments,
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
