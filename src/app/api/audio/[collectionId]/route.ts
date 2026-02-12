import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET: Public - list files in a collection
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const supabase = getSupabaseAdmin();

    // Get the collection
    const { data: collection, error: collError } = await supabase
      .from("audio_collections")
      .select("id, name, description")
      .eq("id", collectionId)
      .maybeSingle();

    if (collError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get files in the collection
    const { data: files, error } = await supabase
      .from("audio_files")
      .select("id, title, speaker, file_url, file_size, duration, file_type, sort_order, created_at")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching audio files:", error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      collection,
      files: files || [],
    });
  } catch (error) {
    console.error("Public audio files error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
