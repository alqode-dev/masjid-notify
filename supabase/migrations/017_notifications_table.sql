-- Migration: Create notifications table for in-app notification center

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching subscriber's unread notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_subscriber_read_created
  ON notifications (subscriber_id, read, created_at DESC);

-- Index for mosque-wide notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_mosque_created
  ON notifications (mosque_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (cron jobs insert, API reads)
CREATE POLICY notifications_service_role ON notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
