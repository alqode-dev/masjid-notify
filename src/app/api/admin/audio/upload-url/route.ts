import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const ALLOWED_MIME_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// POST: Generate a signed upload URL for direct browser→Supabase upload
export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { fileName, fileType, collectionId, fileSize } = body;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP3, M4A, AAC" },
        { status: 400 }
      );
    }

    if (!collectionId || typeof collectionId !== "string") {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
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

    // Sanitize file name: keep alphanumeric, hyphens, dots
    const sanitized = fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 100);

    const uuid = randomUUID();
    const filePath = `${admin.mosque_id}/${collectionId}/${uuid}-${sanitized}`;

    // Create signed upload URL (30 min expiry for large files on slow connections)
    const { data, error } = await supabaseAdmin.storage
      .from("audio")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error creating signed upload URL:", error);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    // Construct the public URL for streaming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/audio/${filePath}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      publicUrl,
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
