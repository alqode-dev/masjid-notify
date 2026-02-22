-- Add attachments column to messages table for announcement media
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;
