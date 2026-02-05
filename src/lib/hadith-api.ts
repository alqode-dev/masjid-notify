/**
 * Hadith API Client
 *
 * Integrates with random-hadith-generator.vercel.app API to fetch authentic hadiths
 * from multiple collections (Bukhari, Muslim, Abu Dawud, Ibn Majah, Tirmidhi).
 *
 * Features:
 * - Fetches random hadiths from 5 authentic collections
 * - Caches daily hadith to ensure all subscribers get the same one
 * - Tracks sent hadiths to prevent repetition within 30 days
 */

import { getSupabaseAdmin } from "./supabase";
import { HADITH_API_DELAY_MS } from "./constants";

const HADITH_API_BASE = "https://random-hadith-generator.vercel.app";

/**
 * Generate a stable ID from hadith text content
 * This ensures the same hadith always gets the same ID for duplicate detection
 * when the API doesn't provide an ID
 */
function generateStableId(text: string, collection: string): number {
  // Simple hash function for consistent ID generation
  let hash = 0;
  const combined = `${collection}:${text}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive number in reasonable range
  return Math.abs(hash) % 100000;
}

// Available hadith collections with approximate counts
export const HADITH_COLLECTIONS = [
  { name: "bukhari", source: "Sahih al-Bukhari", endpoint: "/api/bukhari" },
  { name: "muslim", source: "Sahih Muslim", endpoint: "/api/muslim" },
  { name: "abudawud", source: "Sunan Abu Dawud", endpoint: "/api/abudawud" },
  { name: "ibnmajah", source: "Sunan Ibn Majah", endpoint: "/api/ibnmajah" },
  { name: "tirmidhi", source: "Jami at-Tirmidhi", endpoint: "/api/tirmidhi" },
] as const;

export type CollectionName = (typeof HADITH_COLLECTIONS)[number]["name"];

// API response type (based on the random-hadith-generator API)
export interface HadithApiResponse {
  data: {
    hadith_english: string;
    hadith_arabic?: string;
    header?: string;
    book?: string;
    refno?: string;
    id?: number;
  };
}

// Our normalized hadith type
export interface HadithData {
  collection: string;
  hadithNumber: number;
  textEnglish: string;
  textArabic: string | null;
  source: string;
  reference: string;
}

// Daily hadith log entry
export interface DailyHadithLogEntry {
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
}

/**
 * Fetch a random hadith from a specific collection
 */
export async function fetchRandomHadith(
  collectionName: CollectionName
): Promise<HadithData | null> {
  const collection = HADITH_COLLECTIONS.find((c) => c.name === collectionName);
  if (!collection) {
    console.error(`Unknown collection: ${collectionName}`);
    return null;
  }

  try {
    const response = await fetch(`${HADITH_API_BASE}${collection.endpoint}`, {
      next: { revalidate: 0 }, // No caching for random hadiths
    });

    if (!response.ok) {
      console.error(
        `Hadith API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const result: HadithApiResponse = await response.json();

    if (!result.data || !result.data.hadith_english) {
      console.error("Invalid hadith API response:", result);
      return null;
    }

    const { data } = result;

    // Generate a reference string
    const reference =
      data.refno || data.book || `${collection.source} #${data.id || "N/A"}`;

    // Generate a stable fallback ID based on text content hash when API doesn't provide ID
    // This ensures the same hadith text always gets the same ID for duplicate detection
    const hadithId = data.id || generateStableId(data.hadith_english, collectionName);

    return {
      collection: collectionName,
      hadithNumber: hadithId,
      textEnglish: data.hadith_english.trim(),
      textArabic: data.hadith_arabic?.trim() || null,
      source: collection.source,
      reference: reference,
    };
  } catch (error) {
    console.error(`Failed to fetch hadith from ${collectionName}:`, error);
    return null;
  }
}

/**
 * Get hadiths sent in the last N days
 */
async function getRecentHadiths(days: number = 30): Promise<
  Array<{
    collection: string;
    hadith_number: number;
  }>
> {
  const supabase = getSupabaseAdmin();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("daily_hadith_log")
    .select("collection, hadith_number")
    .gte("date", cutoffDate.toISOString().split("T")[0]);

  if (error) {
    console.error("Failed to fetch recent hadiths:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if a specific hadith was sent recently
 */
function wasRecentlySent(
  hadith: HadithData,
  recentHadiths: Array<{ collection: string; hadith_number: number }>
): boolean {
  return recentHadiths.some(
    (recent) =>
      recent.collection === hadith.collection &&
      recent.hadith_number === hadith.hadithNumber
  );
}

/**
 * Fisher-Yates shuffle for unbiased randomization
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a unique hadith that hasn't been sent in the last 30 days
 * Tries multiple collections to find a non-duplicate
 */
export async function getUniqueHadith(
  maxAttempts: number = 10
): Promise<HadithData | null> {
  const recentHadiths = await getRecentHadiths(30);

  // Shuffle collections using proper Fisher-Yates algorithm
  const shuffledCollections = shuffleArray([...HADITH_COLLECTIONS]);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Pick a collection (cycling through shuffled list)
    const collection =
      shuffledCollections[attempt % shuffledCollections.length];

    const hadith = await fetchRandomHadith(collection.name);

    if (hadith && !wasRecentlySent(hadith, recentHadiths)) {
      return hadith;
    }

    // Small delay between API calls to be polite
    await new Promise((resolve) => setTimeout(resolve, HADITH_API_DELAY_MS));
  }

  // If all attempts fail, return the last fetched hadith anyway
  // (better to have a repeat than no hadith)
  console.warn("Could not find unique hadith after max attempts, using last fetched");
  const fallbackCollection = shuffledCollections[0];
  return fetchRandomHadith(fallbackCollection.name);
}

/**
 * Get today's hadith for a specific time of day (cached)
 * Supports twice-daily hadith: morning (fajr) and evening (maghrib)
 * If already fetched for this time today, returns the cached version
 * Otherwise fetches a new unique hadith and caches it
 *
 * @param timeOfDay - 'morning' for Fajr hadith, 'evening' for Maghrib hadith
 */
export async function getTodaysHadith(
  timeOfDay: "morning" | "evening" = "morning"
): Promise<HadithData | null> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have today's hadith cached for this time of day
  const { data: cached, error: cacheError } = await supabase
    .from("daily_hadith_log")
    .select("*")
    .eq("date", today)
    .eq("time_of_day", timeOfDay)
    .single();

  if (cached && !cacheError) {
    // Return cached hadith
    return {
      collection: cached.collection,
      hadithNumber: cached.hadith_number,
      textEnglish: cached.hadith_text,
      textArabic: cached.hadith_arabic,
      source: cached.source,
      reference: cached.reference,
    };
  }

  // Fetch a new unique hadith
  const hadith = await getUniqueHadith();

  if (!hadith) {
    console.error(`Failed to fetch ${timeOfDay} hadith`);
    return null;
  }

  // Cache it for today with time_of_day
  const { error: insertError } = await supabase.from("daily_hadith_log").insert({
    date: today,
    time_of_day: timeOfDay,
    collection: hadith.collection,
    hadith_number: hadith.hadithNumber,
    hadith_text: hadith.textEnglish,
    hadith_arabic: hadith.textArabic,
    source: hadith.source,
    reference: hadith.reference,
  });

  if (insertError) {
    // If insert fails due to duplicate key (race condition), try to fetch again
    if (insertError.code === "23505") {
      const { data: existingCached } = await supabase
        .from("daily_hadith_log")
        .select("*")
        .eq("date", today)
        .eq("time_of_day", timeOfDay)
        .single();

      if (existingCached) {
        return {
          collection: existingCached.collection,
          hadithNumber: existingCached.hadith_number,
          textEnglish: existingCached.hadith_text,
          textArabic: existingCached.hadith_arabic,
          source: existingCached.source,
          reference: existingCached.reference,
        };
      }
    }
    console.error(`Failed to cache ${timeOfDay} hadith:`, insertError);
  }

  return hadith;
}
