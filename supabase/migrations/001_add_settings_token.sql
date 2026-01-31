-- Migration: Add settings token columns to subscribers table
-- Run this in your Supabase SQL Editor to add settings token support

-- Add settings_token column for secure settings links
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS settings_token VARCHAR(64);

-- Add settings_token_expires column for 24-hour expiry
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS settings_token_expires TIMESTAMP WITH TIME ZONE;

-- Add index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_settings_token
ON subscribers(settings_token);
