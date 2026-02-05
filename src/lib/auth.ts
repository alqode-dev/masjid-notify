import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin, type Admin } from "./supabase";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for server-side use with cookie-based auth
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

export type AuthResult = {
  authenticated: true;
  user: { id: string; email: string };
  admin: Admin;
} | {
  authenticated: false;
  error: string;
  status: number;
};

/**
 * Verifies the current user is authenticated and is an admin
 * Returns the admin record if successful, or an error response if not
 */
export async function verifyAdminAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabase();

  // Get the current session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authenticated: false,
      error: "Unauthorized: No valid session",
      status: 401,
    };
  }

  // Check if user is an admin (using supabaseAdmin to bypass RLS)
  const { data: admin, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (adminError || !admin) {
    return {
      authenticated: false,
      error: "Unauthorized: User is not an admin",
      status: 401,
    };
  }

  return {
    authenticated: true,
    user: { id: user.id, email: user.email || "" },
    admin: admin as Admin,
  };
}

/**
 * Higher-order function to wrap API handlers with admin authentication
 * Use this to protect admin routes
 */
export function withAdminAuth(
  handler: (
    request: Request,
    context: { user: { id: string; email: string }; admin: Admin }
  ) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth();

    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return handler(request, {
      user: authResult.user,
      admin: authResult.admin,
    });
  };
}

/**
 * Verifies cron secret using constant-time comparison to prevent timing attacks
 * Returns true if the authorization header matches the expected cron secret
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return false;
  }

  const expectedValue = `Bearer ${cronSecret}`;
  const receivedBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedValue);

  // For constant-time comparison, both buffers must be the same length
  // If lengths differ, compare against expected to maintain constant time, then return false
  if (receivedBuffer.length !== expectedBuffer.length) {
    // Perform a dummy comparison to prevent timing attacks based on early return
    crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  try {
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
