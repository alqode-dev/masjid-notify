import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

// DELETE - Cancel a scheduled message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // First, verify the message exists and belongs to this admin's mosque
    const { data: message, error: fetchError } = await supabaseAdmin
      .from("scheduled_messages")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        { error: "Scheduled message not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this mosque
    if (message.mosque_id !== authResult.admin.mosque_id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have access to this message" },
        { status: 403 }
      );
    }

    // Only allow cancelling pending messages
    if (message.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending messages can be cancelled" },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from("scheduled_messages")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("Error cancelling message:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled message cancelled",
    });
  } catch (error) {
    console.error("Cancel scheduled message error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
