import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

// PUT: Update a collection (rename/description)
export const PUT = withAdminAuth(async (request, { admin }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

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

    const { data: collection, error } = await supabaseAdmin
      .from("audio_collections")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating audio collection:", error);
      return NextResponse.json(
        { error: "Failed to update collection" },
        { status: 500 }
      );
    }

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Audio collection PUT error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});

// DELETE: Delete a collection and all its files
export const DELETE = withAdminAuth(async (request, { admin }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // First, get all files in this collection to clean up storage
    const { data: files } = await supabaseAdmin
      .from("audio_files")
      .select("file_path")
      .eq("collection_id", id)
      .eq("mosque_id", admin.mosque_id);

    // Delete files from storage
    if (files && files.length > 0) {
      const filePaths = files.map((f) => f.file_path);
      const { error: storageError } = await supabaseAdmin.storage
        .from("audio")
        .remove(filePaths);

      if (storageError) {
        console.error("Error cleaning up storage files:", storageError);
        // Continue with DB deletion even if storage cleanup fails
      }
    }

    // Delete the collection (CASCADE will delete audio_files rows)
    const { error } = await supabaseAdmin
      .from("audio_collections")
      .delete()
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id);

    if (error) {
      console.error("Error deleting audio collection:", error);
      return NextResponse.json(
        { error: "Failed to delete collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audio collection DELETE error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
