-- Add prayer_times_cache table for caching Aladhan API responses
-- Caches prayer times per mosque per day to avoid repeated API calls

CREATE TABLE IF NOT EXISTS prayer_times_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  times JSONB NOT NULL, -- Contains fajr, sunrise, dhuhr, asr, maghrib, isha, imsak, hijriDate, hijriMonth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mosque_id, date)
);

-- Index for fast lookups by mosque and date
CREATE INDEX IF NOT EXISTS idx_prayer_times_cache_lookup ON prayer_times_cache(mosque_id, date);

-- Enable RLS
ALTER TABLE prayer_times_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache (cron jobs run with service role)
-- Public can read cache (for potential client-side use)
CREATE POLICY "Prayer times cache is readable by everyone"
  ON prayer_times_cache FOR SELECT
  USING (true);
