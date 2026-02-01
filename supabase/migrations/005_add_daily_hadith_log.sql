-- Migration: Add daily_hadith_log table for tracking sent hadiths
-- This prevents repetition by logging which hadiths have been sent and when

-- Create the daily_hadith_log table
CREATE TABLE IF NOT EXISTS daily_hadith_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  collection VARCHAR(50) NOT NULL,
  hadith_number INTEGER NOT NULL,
  hadith_text TEXT NOT NULL,
  hadith_arabic TEXT,
  source VARCHAR(100) NOT NULL,
  reference VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient date lookups (getting today's hadith)
CREATE INDEX IF NOT EXISTS idx_daily_hadith_log_date ON daily_hadith_log(date DESC);

-- Index for checking if a specific hadith was recently used
CREATE INDEX IF NOT EXISTS idx_daily_hadith_log_lookup ON daily_hadith_log(collection, hadith_number);

-- Comment on table
COMMENT ON TABLE daily_hadith_log IS 'Tracks daily hadiths sent to prevent repetition within 30 days';
