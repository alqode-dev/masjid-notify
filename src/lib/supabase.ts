import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Get environment variable with fallback for client-side
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    // On client-side, NEXT_PUBLIC_ vars should be inlined at build time
    // If missing, provide helpful error
    if (typeof window !== "undefined") {
      console.error(`Missing environment variable: ${name}. This should be set as a NEXT_PUBLIC_ variable.`);
    }
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// Hardcoded fallbacks for client-side (these get replaced at build time)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Database types
export type Mosque = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  madhab: "hanafi" | "shafii";
  calculation_method: number;
  fajr_offset: number;
  dhuhr_offset: number;
  asr_offset: number;
  maghrib_offset: number;
  isha_offset: number;
  jumuah_adhaan_time: string;
  jumuah_khutbah_time: string;
  timezone: string;
  whatsapp_number: string | null;
  ramadan_mode: boolean;
  suhoor_reminder_mins: number;
  iftar_reminder_mins: number;
  taraweeh_time: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscriber = {
  id: string;
  phone_number: string;
  mosque_id: string;
  subscribed_at: string;
  status: "active" | "paused" | "unsubscribed";
  pause_until: string | null;
  pref_daily_prayers: boolean;
  pref_jumuah: boolean;
  pref_ramadan: boolean;
  pref_hadith: boolean;
  pref_announcements: boolean;
  pref_nafl_salahs: boolean;
  reminder_offset: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Admin = {
  id: string;
  mosque_id: string;
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "announcer";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  mosque_id: string;
  type: "prayer" | "hadith" | "announcement" | "ramadan" | "welcome" | "jumuah" | "nafl" | "webhook_command";
  content: string;
  sent_to_count: number;
  sent_at: string;
  sent_by: string | null;
  status: "pending" | "sent" | "failed" | "received";
  metadata: Record<string, unknown> | null;
};

export type Hadith = {
  id: string;
  text_english: string;
  text_arabic: string | null;
  source: string;
  reference: string;
  category: string | null;
  verified: boolean;
  created_at: string;
};

export type PrayerTimesCache = {
  id: string;
  mosque_id: string;
  date: string; // DATE type as ISO string
  times: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    imsak: string;
    hijriDate: string;
    hijriMonth: string;
  };
  created_at: string;
};

export type DailyHadithLog = {
  id: string;
  date: string;
  time_of_day: "morning" | "evening";
  collection: string;
  hadith_number: number;
  hadith_text: string;
  hadith_arabic: string | null;
  source: string;
  reference: string;
  created_at: string;
};

export type ScheduledMessage = {
  id: string;
  mosque_id: string;
  content: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
  retry_count?: number; // Added for retry limiting (defaults to 0 if column doesn't exist)
};

export type AudioCollection = {
  id: string;
  mosque_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AudioFile = {
  id: string;
  collection_id: string;
  mosque_id: string;
  title: string;
  speaker: string | null;
  file_path: string;
  file_url: string;
  file_size: number | null;
  duration: number | null;
  file_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Client-side Supabase client (for use in React components)
export function createClientSupabase() {
  // Use the constants that are inlined at build time
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Lazy-initialized server-side Supabase client with service role
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabaseAdmin;
}

// Legacy export for backwards compatibility (lazy getter)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

// Singleton browser client
let browserClient: ReturnType<typeof createClientSupabase> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient should only be called on the client");
  }
  if (!browserClient) {
    browserClient = createClientSupabase();
  }
  return browserClient;
}
