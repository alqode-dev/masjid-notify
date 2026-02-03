-- Migration 007: Add Ramadan-related columns to mosques table
-- These columns are needed for the Ramadan settings feature in the admin dashboard.
-- Run this in your Supabase SQL Editor if settings save fails with:
--   "Could not find the 'iftar_reminder_mins' column of 'mosques' in the schema cache"

-- Add Ramadan mode toggle
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS ramadan_mode BOOLEAN DEFAULT FALSE;

-- Add Suhoor reminder offset (minutes before Fajr)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS suhoor_reminder_mins INTEGER DEFAULT 30;

-- Add Iftar reminder offset (minutes before Maghrib)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS iftar_reminder_mins INTEGER DEFAULT 15;

-- Add Taraweeh prayer time (optional)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS taraweeh_time TIME;
