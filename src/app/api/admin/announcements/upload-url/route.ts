import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
};

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    if (!fileType || !ALLOWED_TYPES[fileType]) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Sanitize file name
    const sanitized = fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 100);

    const uuid = randomUUID();
    const filePath = `${admin.mosque_id}/${uuid}-${sanitized}`;

    const { data, error } = await supabaseAdmin.storage
      .from("announcements")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error creating signed upload URL:", error);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/announcements/${filePath}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      publicUrl,
      fileType: ALLOWED_TYPES[fileType],
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
