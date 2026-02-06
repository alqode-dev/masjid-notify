-- Migration: Extend prayer_reminder_locks to handle ALL reminder types
-- This enables atomic locking for nafl (tahajjud, ishraq, awwabin) and jumuah reminders
--
-- The existing prayer_reminder_locks table already has the right structure:
-- - mosque_id, prayer_key, reminder_date, reminder_offset
-- - UNIQUE constraint prevents duplicates
--
-- We just need to ensure it exists and has proper indexes.

-- If table doesn't exist, create it (in case migration 008 wasn't run)
CREATE TABLE IF NOT EXISTS prayer_reminder_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  prayer_key TEXT NOT NULL, -- fajr, dhuhr, asr, maghrib, isha, tahajjud, ishraq, awwabin, jumuah, hadith_morning, hadith_evening
  reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reminder_offset INTEGER NOT NULL DEFAULT 0, -- 0 for nafl/jumuah, 5/10/15/30 for prayers
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mosque_id, prayer_key, reminder_date, reminder_offset)
);

-- Create index if not exists (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_prayer_reminder_locks_date ON prayer_reminder_locks(reminder_date);

-- Enable RLS if not already enabled
ALTER TABLE prayer_reminder_locks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to ensure it exists
DROP POLICY IF EXISTS "Service role full access" ON prayer_reminder_locks;
CREATE POLICY "Service role full access" ON prayer_reminder_locks
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment documenting extended usage
COMMENT ON TABLE prayer_reminder_locks IS 'Prevents duplicate reminders via atomic INSERT with UNIQUE constraint. Supports prayers, nafl, jumuah, and hadith.';

-- Clean up old locks (older than 2 days) to prevent table bloat
DELETE FROM prayer_reminder_locks WHERE reminder_date < CURRENT_DATE - INTERVAL '2 days';
