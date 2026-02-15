-- Migration 014: Add Eid Khutbah time to mosques table
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS eid_khutbah_time TIME;
