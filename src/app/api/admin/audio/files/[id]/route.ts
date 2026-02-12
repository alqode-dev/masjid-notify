import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

// PUT: Update file metadata (title, speaker)
export const PUT = withAdminAuth(async (request, { admin }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, speaker, duration } = body;

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

    const updateData: Record<string, unknown> = {
      title: title.trim(),
      speaker: speaker?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const { data: file, error } = await supabaseAdmin
      .from("audio_files")
      .update(updateData)
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating audio file:", error);
      return NextResponse.json(
        { error: "Failed to update file" },
        { status: 500 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Audio file PUT error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});

// DELETE: Delete a file (DB record + storage)
export const DELETE = withAdminAuth(async (request, { admin }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get the file to find its storage path
    const { data: file, error: fetchError } = await supabaseAdmin
      .from("audio_files")
      .select("file_path")
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id)
      .maybeSingle();

    if (fetchError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("audio")
      .remove([file.file_path]);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue with DB deletion even if storage cleanup fails
    }

    // Delete DB record
    const { error } = await supabaseAdmin
      .from("audio_files")
      .delete()
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id);

    if (error) {
      console.error("Error deleting audio file:", error);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audio file DELETE error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
