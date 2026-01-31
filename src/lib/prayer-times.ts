import { supabaseAdmin } from './supabase'

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

  // Convert to 24-hour
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  // Create date and apply offset
  const date = new Date()
  date.setHours(hours, minutes + offsetMinutes, 0, 0)

  // Format back to 12-hour
  const newHours = date.getHours()
  const newMinutes = date.getMinutes()
  const newPeriod = newHours >= 12 ? 'PM' : 'AM'
  const displayHours = newHours % 12 || 12

  return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`
}

// Check if current time is within X minutes of a prayer time
// Uses a 5-minute window to account for cron timing variance (cron runs every 5 mins)
export function isWithinMinutes(
  prayerTime: string,
  minutesBefore: number,
  timezone: string
): boolean {
  const now = new Date()

  // Parse prayer time
  const match = prayerTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return false

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  // Create prayer time Date object for today
  const prayerDate = new Date()
  prayerDate.setHours(hours, minutes, 0, 0)

  // Calculate reminder time
  const reminderDate = new Date(prayerDate.getTime() - minutesBefore * 60 * 1000)

  // Check if we're within a 5-minute window of the reminder time
  // This matches the cron interval to ensure reminders are never missed
  const diff = Math.abs(now.getTime() - reminderDate.getTime())
  return diff <= 5 * 60 * 1000 // 5 minute window
}

// Check if current time is within X minutes before a fixed time (HH:MM format)
// Uses a 5-minute window to account for cron timing variance (cron runs every 5 mins)
export function isTimeWithinMinutesBefore(
  time: string, // Format: "HH:MM:SS" or "HH:MM"
  minutesBefore: number,
  timezone: string
): boolean {
  const now = new Date()

  // Parse time (expected format: "20:30:00" or "20:30")
  const [hours, minutes] = time.split(':').map(Number)

  // Create target time Date object for today
  const targetDate = new Date()
  targetDate.setHours(hours, minutes, 0, 0)

  // Calculate reminder time
  const reminderDate = new Date(targetDate.getTime() - minutesBefore * 60 * 1000)

  // Check if we're within a 5-minute window of the reminder time
  // This matches the cron interval to ensure reminders are never missed
  const diff = Math.abs(now.getTime() - reminderDate.getTime())
  return diff <= 5 * 60 * 1000 // 5 minute window
}

// Format database time (HH:MM:SS) to display format (H:MM AM/PM)
export function formatDbTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Get Cape Town coordinates (default for pilot)
export const CAPE_TOWN_COORDS = {
  latitude: -33.9249,
  longitude: 18.4241,
}
