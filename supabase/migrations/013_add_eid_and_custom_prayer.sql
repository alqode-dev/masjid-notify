-- Migration 013: Add Eid mode and custom prayer times to mosques table

-- Eid mode: off (default), eid_ul_fitr, eid_ul_adha
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS eid_mode TEXT DEFAULT 'off';
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS eid_salah_time TIME;

-- Custom prayer times: JSONB with 24h HH:MM format
-- Format: { "fajr": "05:30", "sunrise": "06:45", "dhuhr": "12:15", "asr": "15:45", "maghrib": "17:50", "isha": "19:15" }
-- Used when calculation_method = 99 (Custom / Masjid Times)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS custom_prayer_times JSONB;
