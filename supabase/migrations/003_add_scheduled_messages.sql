-- Migration: Add scheduled_messages table for future message scheduling
-- Run this in your Supabase SQL Editor

-- ============================================
-- SCHEDULED MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL
);

-- Index for efficient querying of pending messages due for sending
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_pending ON scheduled_messages(scheduled_at, status) WHERE status = 'pending';

-- Index for mosque-specific queries
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_mosque ON scheduled_messages(mosque_id);

-- Enable RLS
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Admins can view their mosque's scheduled messages
CREATE POLICY "Admins can view their mosque scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = scheduled_messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can create scheduled messages for their mosque
CREATE POLICY "Admins can create scheduled messages"
  ON scheduled_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = scheduled_messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can update (cancel) scheduled messages for their mosque
CREATE POLICY "Admins can update scheduled messages"
  ON scheduled_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = scheduled_messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can delete scheduled messages for their mosque
CREATE POLICY "Admins can delete scheduled messages"
  ON scheduled_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = scheduled_messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );
