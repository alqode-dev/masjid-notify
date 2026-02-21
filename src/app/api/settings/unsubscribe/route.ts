import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { subscriberId } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({
        status: "unsubscribed",
        push_endpoint: null,
        push_p256dh: null,
        push_auth: null,
      })
      .eq("id", subscriberId);

    if (error) {
      console.error("[unsubscribe] Failed:", error.message);
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[unsubscribe] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
