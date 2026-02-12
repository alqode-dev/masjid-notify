import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

// GET: List files in a collection
export const GET = withAdminAuth(async (request, { admin }) => {
  try {
    const url = new URL(request.url);
    const collectionId = url.searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    const { data: files, error } = await supabaseAdmin
      .from("audio_files")
      .select("*")
      .eq("collection_id", collectionId)
      .eq("mosque_id", admin.mosque_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching audio files:", error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    return NextResponse.json({ files: files || [] });
  } catch (error) {
    console.error("Audio files GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});

// POST: Register an uploaded file in the database
export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { collectionId, title, speaker, filePath, fileUrl, fileSize, duration, fileType } = body;

    if (!collectionId || typeof collectionId !== "string") {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: "Title must be 500 characters or fewer" },
        { status: 400 }
      );
    }

    if (!filePath || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: "File path, URL, and type are required" },
        { status: 400 }
      );
    }

    // Verify the collection belongs to the admin's mosque
    const { data: collection, error: collError } = await supabaseAdmin
      .from("audio_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("mosque_id", admin.mosque_id)
      .maybeSingle();

    if (collError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get the next sort order
    const { data: maxSort } = await supabaseAdmin
      .from("audio_files")
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxSort?.sort_order ?? -1) + 1;

    const { data: file, error } = await supabaseAdmin
      .from("audio_files")
      .insert({
        collection_id: collectionId,
        mosque_id: admin.mosque_id,
        title: title.trim(),
        speaker: speaker?.trim() || null,
        file_path: filePath,
        file_url: fileUrl,
        file_size: fileSize || null,
        duration: duration || null,
        file_type: fileType,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audio file record:", error);
      return NextResponse.json(
        { error: "Failed to register file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error("Audio files POST error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
