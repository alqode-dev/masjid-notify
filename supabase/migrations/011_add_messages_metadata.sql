-- Migration: Add metadata JSONB column to messages table
-- Problem: prayer-reminders, nafl-reminders, scheduled messages, and webhook commands
--          all try to insert a 'metadata' field, but the column was never created.
--          This causes all prayer/nafl message logging to silently fail (PGRST204).

-- Add metadata column (nullable JSONB, defaults to NULL)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add index for common metadata queries (e.g., finding messages by prayer type)
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin (metadata);
