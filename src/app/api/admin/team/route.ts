import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { withAdminAuth } from "@/lib/auth";

export const GET = withAdminAuth(async (_request, { admin }) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: admins, error } = await supabase
      .from("admins")
      .select("*")
      .eq("mosque_id", admin.mosque_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching admins:", error);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      admins: admins || [],
      currentAdminId: admin.id,
    });
  } catch (error) {
    console.error("Error in team GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request, { admin }) => {
  try {
    if (admin.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can add team members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role, password } = body;

    // Validate required fields
    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "Email, name, role, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role (never allow creating owners)
    const VALID_ROLES = ["admin", "announcer"];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'announcer'" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check for duplicate admin in this mosque
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("email", trimmedEmail)
      .eq("mosque_id", admin.mosque_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An admin with this email already exists for this mosque" },
        { status: 409 }
      );
    }

    // Create Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      // Surface the actual Supabase Auth error to help diagnose
      const message = authError?.message || "Failed to create user account";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Insert admin row
    const { data: newAdmin, error: insertError } = await supabase
      .from("admins")
      .insert({
        mosque_id: admin.mosque_id,
        user_id: authData.user.id,
        name: trimmedName,
        email: trimmedEmail,
        role,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting admin row:", insertError);
      const insertMsg = insertError.message || "Failed to create team member";
      // Cleanup: delete the auth user we just created
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user after insert failure:", cleanupError);
      }
      return NextResponse.json(
        { error: insertMsg },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error("Error in team POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { admin }) => {
  try {
    if (admin.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can remove team members" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (id === admin.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Look up target admin (scoped to mosque)
    const { data: target, error: lookupError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id)
      .maybeSingle();

    if (lookupError || !target) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Prevent owner deletion
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove an owner" },
        { status: 400 }
      );
    }

    // Delete admin row
    const { error: deleteError } = await supabase
      .from("admins")
      .delete()
      .eq("id", id)
      .eq("mosque_id", admin.mosque_id);

    if (deleteError) {
      console.error("Error deleting admin row:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove team member" },
        { status: 500 }
      );
    }

    // Delete Auth user (non-critical)
    try {
      await supabase.auth.admin.deleteUser(target.user_id);
    } catch (authDeleteError) {
      console.error("Failed to delete auth user (non-critical):", authDeleteError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in team DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
