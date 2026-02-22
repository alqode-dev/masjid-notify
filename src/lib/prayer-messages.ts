/**
 * Inspirational messages for prayer notifications.
 * Rotates deterministically by day-of-year so subscribers see variety.
 */

const messages: Record<string, string[]> = {
  fajr: [
    "Prayer is better than sleep",
    "The two Rak'ahs of Fajr are better than the world and all it contains",
    "Whoever prays Fajr is under the protection of Allah",
    "The most difficult prayers for the hypocrites are Isha and Fajr",
    "Angels witness your Fajr prayer",
  ],
  dhuhr: [
    "Remember Allah in your afternoon",
    "The key to Paradise is prayer",
    "Prayer is the pillar of the religion",
    "Between a man and disbelief is the abandonment of prayer",
  ],
  asr: [
    "Whoever misses Asr prayer, it is as if he lost his family and wealth",
    "Guard strictly the middle prayer (Asr)",
    "The angels of the day and night gather at Asr",
    "Hasten to prayer before it passes you by",
  ],
  maghrib: [
    "Break your fast if fasting, and remember Allah",
    "The sun has set — pray before it is too late",
    "Hasten to Maghrib when the sun sets",
    "Pray on time — it is the best of deeds",
  ],
  isha: [
    "Whoever prays Isha in congregation has stood half the night in prayer",
    "End your day in remembrance of Allah",
    "The night prayer brings you closer to your Lord",
    "Seal your day with prayer",
    "Whoever prays Isha and Fajr in congregation has the reward of the whole night",
  ],
  jumuah: [
    "The best day on which the sun rises is Friday",
    "Send abundant salutations upon the Prophet on Friday",
    "There is an hour on Friday when no Muslim asks Allah except that He gives",
    "Whoever goes early to Jumu'ah, it is as if he sacrificed a camel",
  ],
  suhoor: [
    "Take your suhoor, for in suhoor there is blessing",
    "The suhoor meal is blessed — do not skip it",
    "Allah and His angels send blessings upon those who eat suhoor",
  ],
  iftar: [
    "May Allah accept your fast",
    "The fasting person has two moments of joy",
    "The supplication of the fasting person at iftar is not rejected",
  ],
  taraweeh: [
    "Whoever stands in prayer in Ramadan out of faith, his past sins are forgiven",
    "The mosques are lit with prayer in Ramadan",
    "Stand in prayer tonight — Ramadan nights are precious",
  ],
  suhoor_planning: [
    "Set your alarm for suhoor — blessings await",
    "Plan ahead for a blessed suhoor",
    "Don't miss suhoor — it strengthens your fast",
  ],
  tahajjud: [
    "Our Lord descends to the lowest heaven in the last third of the night",
    "The best prayer after the obligatory is the night prayer",
    "Be among those who rise in the night to pray",
  ],
  ishraq: [
    "Earn the reward of Hajj and Umrah by praying Ishraq",
    "Whoever prays Fajr then sits remembering Allah until sunrise, then prays two Rak'ahs — complete reward",
  ],
  awwabin: [
    "The prayer of the penitent is when the young camels feel the heat of the sand",
    "Pray six Rak'ahs after Maghrib — the prayer of the devout",
  ],
};

/**
 * Get an inspirational message for a prayer, rotating by day-of-year.
 */
export function getInspirationMessage(
  prayerKey: string,
  timezone: string
): string {
  const pool = messages[prayerKey];
  if (!pool || pool.length === 0) return "";

  // Get day-of-year in the mosque's timezone for deterministic rotation
  const now = new Date();
  let dayOfYear: number;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = formatter.format(now); // YYYY-MM-DD
    const dateObj = new Date(dateStr + "T00:00:00");
    const start = new Date(dateObj.getFullYear(), 0, 0);
    dayOfYear = Math.floor(
      (dateObj.getTime() - start.getTime()) / 86400000
    );
  } catch {
    dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
  }

  return pool[dayOfYear % pool.length];
}
