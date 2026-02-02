import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    // Get mosque
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq("slug", DEFAULT_MOSQUE_SLUG)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: "Mosque not found" },
        { status: 404 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("mosque_id", mosque.id)
      .order("subscribed_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: subscribers, error } = await query;

    if (error) {
      console.error("Error fetching subscribers:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      mosque,
    });
  } catch (error) {
    console.error("Error in subscribers API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PATCH = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating subscriber:", error);
      return NextResponse.json(
        { error: "Failed to update subscriber" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in subscriber update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { admin }) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscriber:", error);
      return NextResponse.json(
        { error: "Failed to delete subscriber" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in subscriber delete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
