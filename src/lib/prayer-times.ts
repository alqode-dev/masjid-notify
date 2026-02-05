import { supabaseAdmin } from './supabase'
import { MINUTES_IN_DAY, MINUTES_HALF_DAY, CRON_WINDOW_MINUTES } from './constants'

const ALADHAN_API_URL = process.env.ALADHAN_API_URL || 'https://api.aladhan.com/v1'

interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
}

interface AladhanResponse {
  code: number
  status: string
  data: {
    timings: PrayerTimings
    date: {
      readable: string
      timestamp: string
      hijri: {
        date: string
        month: { number: number; en: string; ar: string }
        year: string
      }
      gregorian: {
        date: string
        month: { number: number; en: string }
        year: string
      }
    }
  }
}

export interface PrayerTimes {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  imsak: string
  date: string
  hijriDate: string
  hijriMonth: string
}

// Method codes for Aladhan API
export const CALCULATION_METHODS = {
  'Muslim World League': 3,
  'Islamic Society of North America (ISNA)': 2,
  'Egyptian General Authority of Survey': 5,
  'Umm Al-Qura University, Makkah': 4,
  'University of Islamic Sciences, Karachi': 1,
  'Institute of Geophysics, University of Tehran': 7,
  'Shia Ithna-Ashari, Leva Institute, Qum': 0,
  'Gulf Region': 8,
  'Kuwait': 9,
  'Qatar': 10,
  'Majlis Ugama Islam Singapura': 11,
  'Union Organization Islamic de France': 12,
  'Diyanet İşleri Başkanlığı, Turkey': 13,
  'Spiritual Administration of Muslims of Russia': 14,
  'Moonsighting Committee Worldwide': 15,
} as const

// Madhab codes
export const MADHAB = {
  'shafii': 0, // Standard (Shafi'i, Maliki, Hanbali)
  'hanafi': 1, // Hanafi
} as const

// Get date string in YYYY-MM-DD format for cache key
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Fetch prayer times from cache
async function getCachedPrayerTimes(
  mosqueId: string,
  dateStr: string
): Promise<PrayerTimes | null> {
  const { data, error } = await supabaseAdmin
    .from('prayer_times_cache')
    .select('times')
    .eq('mosque_id', mosqueId)
    .eq('date', dateStr)
    .single()

  if (error || !data) {
    return null
  }

  // Return cached times with the date
  return {
    ...data.times,
    date: dateStr,
  }
}

// Store prayer times in cache
async function cachePrayerTimes(
  mosqueId: string,
  dateStr: string,
  times: Omit<PrayerTimes, 'date'>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('prayer_times_cache')
    .upsert({
      mosque_id: mosqueId,
      date: dateStr,
      times,
    }, {
      onConflict: 'mosque_id,date',
    })

  if (error) {
    console.error('Error caching prayer times:', error)
  }
}

// Fetch prayer times from Aladhan API
async function fetchPrayerTimesFromAPI(
  latitude: number,
  longitude: number,
  method: number,
  madhab: 'hanafi' | 'shafii',
  targetDate: Date
): Promise<PrayerTimes | null> {
  const day = targetDate.getDate()
  const month = targetDate.getMonth() + 1
  const year = targetDate.getFullYear()

  const url = `${ALADHAN_API_URL}/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${MADHAB[madhab]}`

  const response = await fetch(url)
  const data: AladhanResponse = await response.json()

  if (data.code !== 200) {
    console.error('Aladhan API error:', data)
    return null
  }

  const timings = data.data.timings

  return {
    fajr: formatTime(timings.Fajr),
    sunrise: formatTime(timings.Sunrise),
    dhuhr: formatTime(timings.Dhuhr),
    asr: formatTime(timings.Asr),
    maghrib: formatTime(timings.Maghrib),
    isha: formatTime(timings.Isha),
    imsak: formatTime(timings.Imsak),
    date: data.data.date.gregorian.date,
    hijriDate: data.data.date.hijri.date,
    hijriMonth: data.data.date.hijri.month.en,
  }
}

/**
 * Get prayer times for a mosque with caching support.
 * If mosqueId is provided, checks cache first and caches API response.
 * Cache is automatically invalidated daily via date-based lookups.
 */
export async function getPrayerTimes(
  latitude: number,
  longitude: number,
  method: number = 3, // Default: Muslim World League
  madhab: 'hanafi' | 'shafii' = 'hanafi',
  date?: Date,
  mosqueId?: string
): Promise<PrayerTimes | null> {
  try {
    const targetDate = date || new Date()
    const dateStr = getDateString(targetDate)

    // Check cache if mosqueId is provided
    if (mosqueId) {
      const cached = await getCachedPrayerTimes(mosqueId, dateStr)
      if (cached) {
        return cached
      }
    }

    // Fetch from API
    const prayerTimes = await fetchPrayerTimesFromAPI(
      latitude,
      longitude,
      method,
      madhab,
      targetDate
    )

    if (!prayerTimes) {
      return null
    }

    // Cache the result if mosqueId is provided
    if (mosqueId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { date: _date, ...timesToCache } = prayerTimes
      await cachePrayerTimes(mosqueId, dateStr, timesToCache)
    }

    return prayerTimes
  } catch (error) {
    console.error('Error fetching prayer times:', error)
    return null
  }
}

// Get prayer times for a month (useful for displaying calendars)
export async function getMonthlyPrayerTimes(
  latitude: number,
  longitude: number,
  month: number,
  year: number,
  method: number = 3,
  madhab: 'hanafi' | 'shafii' = 'hanafi'
): Promise<PrayerTimes[]> {
  try {
    const url = `${ALADHAN_API_URL}/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${MADHAB[madhab]}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 200) {
      console.error('Aladhan API error:', data)
      return []
    }

    return data.data.map((day: { timings: PrayerTimings; date: AladhanResponse['data']['date'] }) => ({
      fajr: formatTime(day.timings.Fajr),
      sunrise: formatTime(day.timings.Sunrise),
      dhuhr: formatTime(day.timings.Dhuhr),
      asr: formatTime(day.timings.Asr),
      maghrib: formatTime(day.timings.Maghrib),
      isha: formatTime(day.timings.Isha),
      imsak: formatTime(day.timings.Imsak),
      date: day.date.gregorian.date,
      hijriDate: day.date.hijri.date,
      hijriMonth: day.date.hijri.month.en,
    }))
  } catch (error) {
    console.error('Error fetching monthly prayer times:', error)
    return []
  }
}

// Format time to 12-hour format
function formatTime(time: string): string {
  // Aladhan returns times like "05:23 (SAST)" - extract just the time
  const timeOnly = time.split(' ')[0]
  const [hours, minutes] = timeOnly.split(':').map(Number)

  // Validate parsed values to prevent NaN in output
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('formatTime: Invalid time format:', time)
    return time // Return original if parsing fails
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Apply offset to prayer time
export function applyOffset(time: string, offsetMinutes: number): string {
  // Parse the time
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return time

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()

  // Validate parsed values
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('applyOffset: Invalid time format:', time)
    return time
  }

  // Convert to 24-hour
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  // Calculate total minutes and apply offset
  let totalMinutes = hours * 60 + minutes + offsetMinutes

  // Handle midnight wraparound (both directions)
  while (totalMinutes < 0) totalMinutes += MINUTES_IN_DAY
  while (totalMinutes >= MINUTES_IN_DAY) totalMinutes -= MINUTES_IN_DAY

  // Convert back to hours and minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMinutes = totalMinutes % 60
  const newPeriod = newHours >= 12 ? 'PM' : 'AM'
  const displayHours = newHours % 12 || 12

  return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`
}

/**
 * Get current time in a specific timezone as total minutes since midnight.
 * Uses Intl.DateTimeFormat — built into Node.js, no dependencies.
 */
function getNowInTimezone(timezone: string): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  return hours * 60 + minutes
}

/**
 * Parse a time string (12h "6:15 PM" or 24h "18:15") to minutes since midnight.
 */
function parseTimeToMinutes(time: string): number | null {
  // Try 12-hour format first
  const match12 = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (match12) {
    let hours = parseInt(match12[1])
    const minutes = parseInt(match12[2])
    const period = match12[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }
  // Try 24-hour format (e.g., "18:15" or "18:15:00")
  const match24 = time.match(/^(\d+):(\d+)/)
  if (match24) {
    return parseInt(match24[1]) * 60 + parseInt(match24[2])
  }
  return null
}

// Check if current time is within X minutes before a prayer time
// Uses a 5-minute window to account for cron timing variance (cron runs every 5 mins)
export function isWithinMinutes(
  prayerTime: string,
  minutesBefore: number,
  timezone: string
): boolean {
  const nowMinutes = getNowInTimezone(timezone)
  const prayerMinutes = parseTimeToMinutes(prayerTime)
  if (prayerMinutes === null) return false

  const reminderMinutes = prayerMinutes - minutesBefore
  let diff = Math.abs(nowMinutes - reminderMinutes)

  // Handle midnight wraparound (e.g., Tahajjud at 3 AM, reminder at 11:50 PM)
  if (diff > MINUTES_HALF_DAY) diff = MINUTES_IN_DAY - diff

  return diff <= CRON_WINDOW_MINUTES // Window matches cron interval
}

// Check if current time is within X minutes before a fixed time (HH:MM format)
// Uses a 5-minute window to account for cron timing variance (cron runs every 5 mins)
export function isTimeWithinMinutesBefore(
  time: string, // Format: "HH:MM:SS" or "HH:MM"
  minutesBefore: number,
  timezone: string
): boolean {
  const nowMinutes = getNowInTimezone(timezone)
  const targetMinutes = parseTimeToMinutes(time)
  if (targetMinutes === null) return false

  const reminderMinutes = targetMinutes - minutesBefore
  let diff = Math.abs(nowMinutes - reminderMinutes)
  if (diff > MINUTES_HALF_DAY) diff = MINUTES_IN_DAY - diff

  return diff <= CRON_WINDOW_MINUTES // Window matches cron interval
}

// Format database time (HH:MM:SS) to display format (H:MM AM/PM)
export function formatDbTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)

  // Validate parsed values to prevent NaN in output
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('formatDbTime: Invalid time format:', time)
    return time // Return original if parsing fails
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Calculate nafl salah times based on prayer times
 * - Tahajjud: 2 hours before Fajr (last third of the night)
 * - Ishraq: 20 minutes after Sunrise
 * - Awwabin: 15 minutes after Maghrib
 */
export function calculateNaflTimes(prayerTimes: PrayerTimes): {
  tahajjud: string;
  ishraq: string;
  awwabin: string;
} {
  return {
    tahajjud: applyOffset(prayerTimes.fajr, -120), // 2 hours before Fajr
    ishraq: applyOffset(prayerTimes.sunrise, 20), // 20 mins after Sunrise
    awwabin: applyOffset(prayerTimes.maghrib, 15), // 15 mins after Maghrib
  };
}

/**
 * Check if current time is within minutes after a prayer time
 * Similar to isWithinMinutes but for time AFTER prayer (e.g., Ishraq after Sunrise)
 */
export function isWithinMinutesAfter(
  prayerTime: string,
  minutesAfter: number,
  timezone: string
): boolean {
  const nowMinutes = getNowInTimezone(timezone)
  const prayerMinutes = parseTimeToMinutes(prayerTime)
  if (prayerMinutes === null) return false

  const targetMinutes = prayerMinutes + minutesAfter
  let diff = Math.abs(nowMinutes - targetMinutes)
  if (diff > MINUTES_HALF_DAY) diff = MINUTES_IN_DAY - diff

  return diff <= CRON_WINDOW_MINUTES // Window matches cron interval
}
