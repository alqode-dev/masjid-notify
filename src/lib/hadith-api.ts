/**
 * Hadith API Client
 *
 * Integrates with fawazahmed0/hadith-api (hosted on jsDelivr CDN) to fetch authentic hadiths
 * from multiple collections (Bukhari, Muslim, Abu Dawud, Ibn Majah, Tirmidhi, Nasai).
 *
 * Features:
 * - Fetches random hadiths from 6 authentic collections
 * - Hosted on jsDelivr CDN for high reliability
 * - Caches daily hadith to ensure all subscribers get the same one
 * - Tracks sent hadiths to prevent repetition within 30 days
 *
 * API Source: https://github.com/fawazahmed0/hadith-api
 */

import { getSupabaseAdmin } from "./supabase";
import { HADITH_API_DELAY_MS } from "./constants";

// CDN base URL for hadith API (highly reliable)
const HADITH_CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// Available hadith collections with their hadith count ranges
// These counts are approximate - the API handles out-of-range gracefully
export const HADITH_COLLECTIONS = [
  { name: "bukhari", source: "Sahih al-Bukhari", edition: "eng-bukhari", maxHadith: 7563 },
  { name: "muslim", source: "Sahih Muslim", edition: "eng-muslim", maxHadith: 7563 },
  { name: "abudawud", source: "Sunan Abu Dawud", edition: "eng-abudawud", maxHadith: 5274 },
  { name: "tirmidhi", source: "Jami at-Tirmidhi", edition: "eng-tirmidhi", maxHadith: 3956 },
  { name: "ibnmajah", source: "Sunan Ibn Majah", edition: "eng-ibnmajah", maxHadith: 4341 },
  { name: "nasai", source: "Sunan an-Nasa'i", edition: "eng-nasai", maxHadith: 5758 },
] as const;

export type CollectionName = (typeof HADITH_COLLECTIONS)[number]["name"];

// API response type for individual hadith
interface HadithApiResponse {
  metadata: {
    name: string;
    section?: Record<string, string>;
  };
  hadiths: Array<{
    hadithnumber: number;
    arabicnumber: number;
    text: string;
    grades: Array<{ name: string; grade: string }>;
    reference: {
      book: number;
      hadith: number;
    };
  }>;
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
 * Fetch a specific hadith by number from a collection
 */
async function fetchHadithByNumber(
  edition: string,
  hadithNumber: number
): Promise<HadithApiResponse | null> {
  try {
    const url = `${HADITH_CDN_BASE}/editions/${edition}/${hadithNumber}.json`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour (CDN content is static)
    });

    if (!response.ok) {
      // Hadith number might not exist, return null
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch hadith ${hadithNumber} from ${edition}:`, error);
    return null;
  }
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

  // Try up to 5 random numbers to find a valid hadith
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate random hadith number (start from 1, not 0)
    const randomNumber = Math.floor(Math.random() * collection.maxHadith) + 1;

    const result = await fetchHadithByNumber(collection.edition, randomNumber);

    if (result && result.hadiths && result.hadiths.length > 0) {
      const hadith = result.hadiths[0];

      // Skip if text is too short (likely incomplete)
      if (!hadith.text || hadith.text.length < 50) {
        continue;
      }

      // Format reference string
      const reference = hadith.reference.book > 0
        ? `Book ${hadith.reference.book}, Hadith ${hadith.reference.hadith}`
        : `Hadith ${hadith.hadithnumber}`;

      return {
        collection: collectionName,
        hadithNumber: hadith.hadithnumber,
        textEnglish: hadith.text.trim(),
        textArabic: null, // This API doesn't include Arabic in English editions
        source: collection.source,
        reference: reference,
      };
    }

    // Small delay before retry
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.error(`Failed to fetch valid hadith from ${collectionName} after 5 attempts`);
  return null;
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
  timeOfDay: "morning" | "evening" = "morning",
  timezone?: string
): Promise<HadithData | null> {
  const supabase = getSupabaseAdmin();
  // Use timezone-aware date to avoid wrong day near midnight (e.g., SAST is UTC+2)
  let today: string;
  if (timezone) {
    try {
      today = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      today = new Date().toISOString().split("T")[0];
    }
  } else {
    today = new Date().toISOString().split("T")[0];
  }

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
