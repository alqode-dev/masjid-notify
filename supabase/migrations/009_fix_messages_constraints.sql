-- Migration: Fix messages table CHECK constraints and prayer_times_cache RLS policies
-- Problem: Code uses 'nafl' type and 'webhook_command' type with 'received' status
--          which are not in the current CHECK constraints

-- 1. Update messages type constraint to include 'nafl' and 'webhook_command'
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('prayer', 'hadith', 'announcement', 'ramadan', 'welcome', 'jumuah', 'nafl', 'webhook_command'));

-- 2. Add status column if it doesn't exist, then update constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
  END IF;
END $$;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'received'));

-- 3. Add RLS policies for prayer_times_cache to allow service role writes
-- Note: Service role bypasses RLS by default, but explicit policies ensure reliability

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert prayer times cache" ON prayer_times_cache;
DROP POLICY IF EXISTS "Service role can update prayer times cache" ON prayer_times_cache;

-- Create insert policy
CREATE POLICY "Service role can insert prayer times cache"
  ON prayer_times_cache FOR INSERT
  WITH CHECK (true);

-- Create update policy
CREATE POLICY "Service role can update prayer times cache"
  ON prayer_times_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);
