-- Migration: Add prayer_reminder_locks table
-- Purpose: Prevent duplicate prayer reminders using database-level uniqueness
--
-- The Problem: Multiple cron runs can check wasRecentlySent() simultaneously,
-- all see "not sent", and all send - causing 3-5x duplicate messages.
--
-- The Solution: Atomic INSERT with UNIQUE constraint. First cron run claims
-- the slot, others fail with duplicate key error and skip.

CREATE TABLE IF NOT EXISTS prayer_reminder_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  prayer_key TEXT NOT NULL, -- fajr, dhuhr, asr, maghrib, isha
  reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reminder_offset INTEGER NOT NULL, -- 5, 10, 15, or 30 minutes
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- THIS IS THE KEY: Database enforces ONE entry per prayer/date/offset
  UNIQUE(mosque_id, prayer_key, reminder_date, reminder_offset)
);

-- Index for cleanup queries
CREATE INDEX idx_prayer_reminder_locks_date ON prayer_reminder_locks(reminder_date);

-- Auto-cleanup old locks (older than 2 days) - run daily via pg_cron or manually
-- DELETE FROM prayer_reminder_locks WHERE reminder_date < CURRENT_DATE - INTERVAL '2 days';

-- Enable RLS
ALTER TABLE prayer_reminder_locks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON prayer_reminder_locks
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE prayer_reminder_locks IS 'Prevents duplicate prayer reminders via atomic INSERT with UNIQUE constraint';
