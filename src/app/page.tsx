import { getSupabaseAdmin } from "@/lib/supabase";
import { getMosquePrayerTimes } from "@/lib/prayer-times";
import { LandingPage } from "./landing-page";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";
// Prevent Next.js from caching any fetch() calls in this page
export const fetchCache = "force-no-store";

async function getMosqueData() {
  const { data: mosque, error } = await getSupabaseAdmin()
    .from("mosques")
    .select("*")
    .eq("slug", DEFAULT_MOSQUE_SLUG)
    .single();

  if (error || !mosque) {
    console.error("Error fetching mosque:", error);
    return null;
  }

  return mosque;
}

async function getPrayerTimesData(mosque: {
  id: string;
  latitude: number;
  longitude: number;
  calculation_method: number;
  madhab: "hanafi" | "shafii";
  timezone: string;
  custom_prayer_times: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string } | null;
}) {
  return getMosquePrayerTimes(mosque);
}

export default async function Home() {
  const mosque = await getMosqueData();

  if (!mosque) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Service Unavailable
          </h1>
          <p className="text-muted-foreground">
            We&apos;re experiencing technical difficulties. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Diagnostic: log what the DB returned for prayer time config
  console.log("[page] mosque.calculation_method:", mosque.calculation_method, typeof mosque.calculation_method);
  console.log("[page] mosque.custom_prayer_times:", mosque.custom_prayer_times ? "SET" : "NULL/UNDEFINED");

  let prayerTimes = null;
  try {
    prayerTimes = await getPrayerTimesData(mosque);
    if (prayerTimes) {
      console.log("[page] prayer times source:", Number(mosque.calculation_method) === 99 && mosque.custom_prayer_times ? "CUSTOM" : "API");
      console.log("[page] fajr:", prayerTimes.fajr, "| asr:", prayerTimes.asr);
    }
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masjid-notify.vercel.app";

  return <LandingPage mosque={mosque} prayerTimes={prayerTimes} siteUrl={siteUrl} />;
}
