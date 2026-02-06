import { getSupabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes } from "@/lib/prayer-times";
import { LandingPage } from "./landing-page";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

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
  latitude: number;
  longitude: number;
  calculation_method: number;
  madhab: "hanafi" | "shafii";
}) {
  const prayerTimes = await getPrayerTimes(
    mosque.latitude,
    mosque.longitude,
    mosque.calculation_method,
    mosque.madhab
  );

  return prayerTimes;
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

  let prayerTimes = null;
  try {
    prayerTimes = await getPrayerTimesData(mosque);
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masjid-notify.vercel.app";

  return <LandingPage mosque={mosque} prayerTimes={prayerTimes} siteUrl={siteUrl} />;
}
