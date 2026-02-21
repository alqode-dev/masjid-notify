-- Migration: Final cleanup - drop old phone column and update message type constraint

-- Drop the renamed phone column
ALTER TABLE subscribers DROP COLUMN IF EXISTS phone_number_old;

-- Delete old webhook_command messages (WhatsApp-era, no longer relevant)
DELETE FROM messages WHERE type = 'webhook_command';

-- Update messages type constraint to remove webhook_command
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('prayer', 'hadith', 'announcement', 'ramadan', 'welcome', 'jumuah', 'nafl'));
