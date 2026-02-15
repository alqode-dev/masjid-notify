/**
 * Pure client-safe time formatting utilities.
 * Separated from prayer-times.ts to avoid pulling server-only
 * Supabase imports into client bundles.
 */

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
