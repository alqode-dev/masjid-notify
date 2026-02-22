import { supabaseAdmin, type Mosque } from './supabase'
import { MINUTES_IN_DAY, MINUTES_HALF_DAY, CRON_WINDOW_MINUTES, JAMAAT_DELAY_MINUTES, TAHAJJUD_MINUTES_BEFORE_FAJR, ISHRAQ_MINUTES_AFTER_SUNRISE, AWWABIN_MINUTES_AFTER_MAGHRIB } from './constants'

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
  hijriYear: string
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
// Uses timezone-aware formatting to avoid wrong date near midnight
function getDateString(date: Date, timezone?: string): string {
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      return formatter.format(date) // Returns YYYY-MM-DD in en-CA locale
    } catch {
      // Fall through to UTC if timezone is invalid
    }
  }
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

  // Self-heal stale cache entries missing Hijri fields
  if (!data.times.hijriDate || !data.times.hijriMonth) {
    return null // Cache miss — will re-fetch from API with all fields
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
  targetDate: Date,
  timezone?: string
): Promise<PrayerTimes | null> {
  // Use timezone-aware date to match cache key date
  // Without this, near midnight the API could fetch wrong day's times
  let day: number, month: number, year: number
  if (timezone) {
    const dateStr = getDateString(targetDate, timezone) // YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number)
    day = d
    month = m
    year = y
  } else {
    day = targetDate.getDate()
    month = targetDate.getMonth() + 1
    year = targetDate.getFullYear()
  }

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
    hijriYear: data.data.date.hijri.year,
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
  mosqueId?: string,
  timezone?: string
): Promise<PrayerTimes | null> {
  try {
    const targetDate = date || new Date()
    const dateStr = getDateString(targetDate, timezone)

    // Check cache if mosqueId is provided
    if (mosqueId) {
      const cached = await getCachedPrayerTimes(mosqueId, dateStr)
      if (cached) {
        return cached
      }
    }

    // Fetch from API (pass timezone for correct date calculation)
    const prayerTimes = await fetchPrayerTimesFromAPI(
      latitude,
      longitude,
      method,
      madhab,
      targetDate,
      timezone
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

/**
 * Convert 24h time "HH:MM" to 12h format "H:MM AM/PM"
 */
function format24to12(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time24
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Fetch just the Hijri date for a given Gregorian date from Aladhan API.
 */
async function fetchHijriDate(timezone?: string): Promise<{ date: string; hijriDate: string; hijriMonth: string; hijriYear: string }> {
  const now = new Date()
  const dateStr = getDateString(now, timezone)
  const [y, m, d] = dateStr.split('-')

  try {
    const res = await fetch(`${ALADHAN_API_URL}/gpiDate/${d}-${m}-${y}`)
    const data = await res.json()
    if (data.code === 200) {
      return {
        date: data.data.gregorian.date,
        hijriDate: data.data.hijri.date,
        hijriMonth: data.data.hijri.month.en,
        hijriYear: data.data.hijri.year,
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Hijri date:', e)
  }

  // Fallback: use formatted date without Hijri
  return { date: dateStr, hijriDate: '', hijriMonth: '', hijriYear: '' }
}

/**
 * Get prayer times for a mosque, supporting both API-based and custom/masjid times.
 *
 * When calculation_method === 99 and custom_prayer_times is set, returns the
 * admin-entered times directly instead of calling the Aladhan API.
 *
 * This is the recommended function for all callers (cron jobs, landing page).
 */
export async function getMosquePrayerTimes(
  mosque: Pick<Mosque, 'id' | 'latitude' | 'longitude' | 'calculation_method' | 'madhab' | 'timezone' | 'custom_prayer_times'>,
  date?: Date
): Promise<PrayerTimes | null> {
  // Custom / Masjid Times mode
  // Skip prayer cache entirely — custom times come straight from the mosque
  // config and are trivial to construct. This avoids stale cache entries from
  // a previous calculation method being returned after switching to custom.
  const calcMethod = Number(mosque.calculation_method)
  if (calcMethod === 99 && mosque.custom_prayer_times) {
    const custom = mosque.custom_prayer_times

    // Validate that all custom time fields are non-empty
    const allFilled = custom.fajr && custom.sunrise && custom.dhuhr &&
      custom.asr && custom.maghrib && custom.isha
    if (allFilled) {
      // Fetch Hijri date from Aladhan (lightweight call, no prayer calc needed)
      const dateInfo = await fetchHijriDate(mosque.timezone)

      return {
        fajr: format24to12(custom.fajr),
        sunrise: format24to12(custom.sunrise),
        dhuhr: format24to12(custom.dhuhr),
        asr: format24to12(custom.asr),
        maghrib: format24to12(custom.maghrib),
        isha: format24to12(custom.isha),
        imsak: format24to12(custom.fajr), // Imsak = Fajr for custom times
        date: dateInfo.date,
        hijriDate: dateInfo.hijriDate,
        hijriMonth: dateInfo.hijriMonth,
        hijriYear: dateInfo.hijriYear,
      }
    }
    console.warn('Custom prayer times incomplete, falling back to API method 3. Fields:', custom)
  }

  // Safety: method 99 is not a valid Aladhan API method.
  // Fall back to Muslim World League (3) if custom times were not usable.
  const apiMethod = calcMethod === 99 ? 3 : calcMethod

  // Standard API-based times
  return getPrayerTimes(
    mosque.latitude,
    mosque.longitude,
    apiMethod,
    mosque.madhab,
    date,
    mosque.id,
    mosque.timezone
  )
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
    hourCycle: 'h23', // Explicit: midnight = 0 (not 24). Some V8/ICU versions default to h24.
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

  // Normalize to 0-1439 range to handle midnight wraparound correctly
  // e.g., prayer at 1:00 AM (60 min) with 120 min offset → -60 → 1380 (11:00 PM)
  let reminderMinutes = prayerMinutes - minutesBefore
  while (reminderMinutes < 0) reminderMinutes += MINUTES_IN_DAY
  while (reminderMinutes >= MINUTES_IN_DAY) reminderMinutes -= MINUTES_IN_DAY

  let diff = Math.abs(nowMinutes - reminderMinutes)

  // Handle midnight wraparound (e.g., now=23:58, reminder=00:02 → diff should be 4, not 1436)
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

  // Normalize to 0-1439 range for correct midnight wraparound
  let reminderMinutes = targetMinutes - minutesBefore
  while (reminderMinutes < 0) reminderMinutes += MINUTES_IN_DAY
  while (reminderMinutes >= MINUTES_IN_DAY) reminderMinutes -= MINUTES_IN_DAY

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
 * Calculate nafl salah times based on prayer times.
 * Uses constants from constants.ts as the single source of truth.
 */
export function calculateNaflTimes(prayerTimes: PrayerTimes): {
  tahajjud: string;
  ishraq: string;
  awwabin: string;
} {
  return {
    tahajjud: applyOffset(prayerTimes.fajr, -TAHAJJUD_MINUTES_BEFORE_FAJR),
    ishraq: applyOffset(prayerTimes.sunrise, ISHRAQ_MINUTES_AFTER_SUNRISE),
    awwabin: applyOffset(prayerTimes.maghrib, AWWABIN_MINUTES_AFTER_MAGHRIB),
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

  // Normalize to 0-1439 range for correct midnight wraparound
  let targetMinutes = prayerMinutes + minutesAfter
  while (targetMinutes >= MINUTES_IN_DAY) targetMinutes -= MINUTES_IN_DAY

  let diff = Math.abs(nowMinutes - targetMinutes)
  if (diff > MINUTES_HALF_DAY) diff = MINUTES_IN_DAY - diff

  return diff <= CRON_WINDOW_MINUTES // Window matches cron interval
}

/**
 * Convert Adhan time to Jamaat (congregation) time.
 *
 * At Anwaarul Islam Rondebosch East (and most mosques):
 * - Jamaat starts 15 minutes after Adhan for all prayers
 * - EXCEPTION: Maghrib - Jamaat starts immediately with Adhan
 *
 * @param adhanTime - The Adhan time in "HH:MM AM/PM" format
 * @param prayerKey - The prayer identifier (fajr, dhuhr, asr, maghrib, isha)
 * @returns Jamaat time in the same format
 */
export function getJamaatTime(adhanTime: string, prayerKey: string): string {
  // Maghrib exception: Jamaat starts immediately with Adhan
  if (prayerKey.toLowerCase() === 'maghrib') {
    return adhanTime
  }

  // All other prayers: Jamaat is 15 minutes after Adhan
  return applyOffset(adhanTime, JAMAAT_DELAY_MINUTES)
}
