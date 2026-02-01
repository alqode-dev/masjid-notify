import { getSupabaseAdmin } from "@/lib/supabase";
import { getPrayerTimes } from "@/lib/prayer-times";
import { LandingPage } from "./landing-page";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes

async function getMosqueData() {
  // Single mosque instance - Anwaarul Islam Rondebosch East
  try {
    const targetSlug = "anwaarul-islam-rondebosch-east";
    console.log("Querying for slug:", targetSlug);
    console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    // First, try to get ALL mosques to see what's in the table
    const { data: allMosques, error: listError } = await getSupabaseAdmin()
      .from("mosques")
      .select("id, slug, name");

    console.log("All mosques in DB:", JSON.stringify(allMosques));
    if (listError) {
      console.error("Error listing mosques:", JSON.stringify(listError));
    }

    const { data: mosque, error } = await getSupabaseAdmin()
      .from("mosques")
      .select("*")
      .eq("slug", targetSlug)
      .single();

    if (error) {
      console.error("Error fetching mosque:", JSON.stringify(error));
      return null;
    }

    console.log("Mosque found:", mosque?.name);
    return mosque;
  } catch (e) {
    console.error("Exception in getMosqueData:", e);
    return null;
  }
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

  const prayerTimes = await getPrayerTimesData(mosque);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masjid-notify.vercel.app";

  return <LandingPage mosque={mosque} prayerTimes={prayerTimes} siteUrl={siteUrl} />;
}
