/**
 * Pure client-safe time formatting utilities.
 * Separated from prayer-times.ts to avoid pulling server-only
 * Supabase imports into client bundles.
 */

/** Parse 12h time "H:MM AM/PM" to minutes since midnight */
export function parseTime12hToMinutes(time: string): number | null {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()
  if (isNaN(hours) || isNaN(minutes)) return null
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

/** Convert minutes since midnight to "H:MM AM/PM" */
export function minutesToTime12h(totalMinutes: number): string {
  // Wrap to 0-1439 range
  while (totalMinutes < 0) totalMinutes += 1440
  while (totalMinutes >= 1440) totalMinutes -= 1440
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/** Add minutes to a 12h time string, return 12h formatted result */
export function addMinutesToTime(time: string, minutes: number): string | null {
  const base = parseTime12hToMinutes(time)
  if (base === null) return null
  return minutesToTime12h(base + minutes)
}

/** Get midpoint between two 12h time strings */
export function midpointTime(time1: string, time2: string): string | null {
  const m1 = parseTime12hToMinutes(time1)
  const m2 = parseTime12hToMinutes(time2)
  if (m1 === null || m2 === null) return null
  // Handle case where time2 is past midnight relative to time1
  let mid: number
  if (m2 >= m1) {
    mid = (m1 + m2) / 2
  } else {
    mid = (m1 + m2 + 1440) / 2
    if (mid >= 1440) mid -= 1440
  }
  return minutesToTime12h(mid)
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
