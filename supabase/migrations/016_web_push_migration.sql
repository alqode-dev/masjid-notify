-- Migration: Add web push notification columns to subscribers
-- Replaces phone-based WhatsApp subscription with push subscription

-- Add push subscription columns
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS push_endpoint TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS push_p256dh TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS push_auth TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create unique index on push endpoint per mosque (prevents duplicate push subscriptions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_push_endpoint_mosque
  ON subscribers (push_endpoint, mosque_id)
  WHERE push_endpoint IS NOT NULL;

-- Drop settings token columns (no longer needed - settings accessed via localStorage subscriber ID)
ALTER TABLE subscribers DROP COLUMN IF EXISTS settings_token;
ALTER TABLE subscribers DROP COLUMN IF EXISTS settings_token_expires;

-- Rename phone_number to phone_number_old (temporary - will be dropped in migration 018)
-- Keep data for reference during transition
ALTER TABLE subscribers RENAME COLUMN phone_number TO phone_number_old;

-- Drop old phone unique constraint if it exists
DROP INDEX IF EXISTS idx_subscribers_phone_mosque;
DROP INDEX IF EXISTS subscribers_phone_number_mosque_id_key;
