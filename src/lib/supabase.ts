import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  pref_fajr: boolean;
  pref_all_prayers: boolean;
  pref_jumuah: boolean;
  pref_programs: boolean;
  pref_hadith: boolean;
  pref_ramadan: boolean;
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
  type: "prayer" | "hadith" | "announcement" | "ramadan" | "welcome" | "jumuah";
  content: string;
  sent_to_count: number;
  sent_at: string;
  sent_by: string | null;
  status: "pending" | "sent" | "failed";
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

export type ScheduledMessage = {
  id: string;
  mosque_id: string;
  content: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled";
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
};

// Client-side Supabase client (for use in React components)
export function createClientSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server-side Supabase client with service role (for API routes, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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
