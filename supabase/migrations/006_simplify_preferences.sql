-- Migration: Simplify subscriber preferences from 6 options to 5
--
-- New preferences:
-- 1. pref_daily_prayers - All 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
-- 2. pref_jumuah - Jumu'ah Khutbah reminder (already exists)
-- 3. pref_ramadan - Ramadan mode (already exists)
-- 4. pref_hadith - Daily hadith (already exists)
-- 5. pref_announcements - Announcements & Events (renamed from pref_programs)

-- Step 1: Add new pref_daily_prayers column
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS pref_daily_prayers BOOLEAN DEFAULT TRUE;

-- Step 2: Migrate existing data
-- If pref_all_prayers was true, set pref_daily_prayers true
-- If pref_fajr was true but pref_all_prayers was false, still set to true
-- (Users who wanted Fajr likely want all prayer reminders in simplified model)
UPDATE subscribers
SET pref_daily_prayers = COALESCE(pref_all_prayers, pref_fajr, TRUE);

-- Step 3: Rename pref_programs to pref_announcements
ALTER TABLE subscribers RENAME COLUMN pref_programs TO pref_announcements;

-- Step 4: Drop old columns that are no longer needed
ALTER TABLE subscribers DROP COLUMN IF EXISTS pref_fajr;
ALTER TABLE subscribers DROP COLUMN IF EXISTS pref_all_prayers;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscribers'
AND column_name IN ('pref_daily_prayers', 'pref_jumuah', 'pref_ramadan', 'pref_hadith', 'pref_announcements')
ORDER BY column_name;
