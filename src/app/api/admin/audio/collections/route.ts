import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

// GET: List all collections for the admin's mosque
export const GET = withAdminAuth(async (_request, { admin }) => {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from("audio_collections")
      .select("*, audio_files(count)")
      .eq("mosque_id", admin.mosque_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching audio collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 }
      );
    }

    // Transform the count from Supabase's nested format
    const collectionsWithCount = (collections || []).map((c) => ({
      ...c,
      file_count: c.audio_files?.[0]?.count ?? 0,
      audio_files: undefined,
    }));

    return NextResponse.json({ collections: collectionsWithCount });
  } catch (error) {
    console.error("Audio collections GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});

// POST: Create a new collection
export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        { error: "Collection name must be 200 characters or fewer" },
        { status: 400 }
      );
    }

    // Get the next sort order
    const { data: maxSort } = await supabaseAdmin
      .from("audio_collections")
      .select("sort_order")
      .eq("mosque_id", admin.mosque_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxSort?.sort_order ?? -1) + 1;

    const { data: collection, error } = await supabaseAdmin
      .from("audio_collections")
      .insert({
        mosque_id: admin.mosque_id,
        name: name.trim(),
        description: description?.trim() || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audio collection:", error);
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Audio collections POST error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
