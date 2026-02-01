-- Migration: Update mosque from Test Masjid to Anwaarul Islam Rondebosch East
-- This updates the existing test mosque record with real mosque details

UPDATE mosques
SET
  name = 'Anwaarul Islam Rondebosch East',
  slug = 'anwaarul-islam-rondebosch-east',
  city = 'Cape Town',
  country = 'South Africa',
  madhab = 'hanafi',
  jumuah_khutbah_time = '13:20:00',
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE slug = 'test-masjid';

-- Verify the update
SELECT id, name, slug, city, country, madhab, timezone
FROM mosques
WHERE slug = 'anwaarul-islam-rondebosch-east';
