import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

// GET: Public - list collections with file counts
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get mosque by slug
    const { data: mosque, error: mosqueError } = await supabase
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

    const { data: collections, error } = await supabase
      .from("audio_collections")
      .select("id, name, description, sort_order, audio_files(count)")
      .eq("mosque_id", mosque.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching public audio collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 }
      );
    }

    const collectionsWithCount = (collections || []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sort_order: c.sort_order,
      file_count: c.audio_files?.[0]?.count ?? 0,
    }));

    return NextResponse.json({
      mosque: { id: mosque.id, name: mosque.name },
      collections: collectionsWithCount,
    });
  } catch (error) {
    console.error("Public audio collections error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
