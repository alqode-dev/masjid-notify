-- Masjid Notify Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MOSQUES TABLE
-- ============================================
CREATE TABLE mosques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'South Africa',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  madhab VARCHAR(20) DEFAULT 'hanafi' CHECK (madhab IN ('hanafi', 'shafii')),
  calculation_method INTEGER DEFAULT 3, -- Muslim World League
  fajr_offset INTEGER DEFAULT 0,
  dhuhr_offset INTEGER DEFAULT 0,
  asr_offset INTEGER DEFAULT 0,
  maghrib_offset INTEGER DEFAULT 0,
  isha_offset INTEGER DEFAULT 0,
  jumuah_adhaan_time TIME DEFAULT '12:45:00',
  jumuah_khutbah_time TIME DEFAULT '13:00:00',
  timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
  whatsapp_number VARCHAR(20),
  ramadan_mode BOOLEAN DEFAULT FALSE,
  suhoor_reminder_mins INTEGER DEFAULT 30,
  iftar_reminder_mins INTEGER DEFAULT 15,
  taraweeh_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'unsubscribed')),
  pause_until TIMESTAMP WITH TIME ZONE,
  pref_fajr BOOLEAN DEFAULT TRUE,
  pref_all_prayers BOOLEAN DEFAULT FALSE,
  pref_jumuah BOOLEAN DEFAULT TRUE,
  pref_programs BOOLEAN DEFAULT TRUE,
  pref_hadith BOOLEAN DEFAULT FALSE,
  pref_ramadan BOOLEAN DEFAULT TRUE,
  reminder_offset INTEGER DEFAULT 15, -- minutes before prayer
  last_message_at TIMESTAMP WITH TIME ZONE,
  settings_token VARCHAR(64), -- Token for settings link
  settings_token_expires TIMESTAMP WITH TIME ZONE, -- Token expiry (24 hours)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_number, mosque_id)
);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'announcer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, mosque_id)
);

-- ============================================
-- MESSAGES LOG TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('prayer', 'hadith', 'announcement', 'ramadan', 'welcome', 'jumuah')),
  content TEXT NOT NULL,
  sent_to_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB
);

-- ============================================
-- HADITH TABLE (Curated content)
-- ============================================
CREATE TABLE hadith (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_english TEXT NOT NULL,
  text_arabic TEXT,
  source VARCHAR(100) NOT NULL, -- e.g., "Sahih Bukhari"
  reference VARCHAR(50) NOT NULL, -- e.g., "1234"
  category VARCHAR(100), -- e.g., "Prayer", "Fasting", "Character"
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_subscribers_mosque ON subscribers(mosque_id);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_phone ON subscribers(phone_number);
CREATE INDEX idx_subscribers_settings_token ON subscribers(settings_token);
CREATE INDEX idx_messages_mosque ON messages(mosque_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_admins_mosque ON admins(mosque_id);
CREATE INDEX idx_admins_user ON admins(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith ENABLE ROW LEVEL SECURITY;

-- Public can view mosques (for landing pages)
CREATE POLICY "Public mosques are viewable by everyone"
  ON mosques FOR SELECT
  USING (true);

-- Only admins can update their mosque
CREATE POLICY "Admins can update their mosque"
  ON mosques FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = mosques.id
      AND admins.user_id = auth.uid()
      AND admins.role IN ('owner', 'admin')
    )
  );

-- Subscribers: admins can view their mosque's subscribers
CREATE POLICY "Admins can view their mosque subscribers"
  ON subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = subscribers.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Allow insert for new subscribers (public)
CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  WITH CHECK (true);

-- Admins can update/delete subscribers
CREATE POLICY "Admins can manage subscribers"
  ON subscribers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = subscribers.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can view their mosque's messages
CREATE POLICY "Admins can view their mosque messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can insert messages
CREATE POLICY "Admins can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.mosque_id = messages.mosque_id
      AND admins.user_id = auth.uid()
    )
  );

-- Admins can view their own record
CREATE POLICY "Admins can view their own record"
  ON admins FOR SELECT
  USING (user_id = auth.uid());

-- Hadith is public read
CREATE POLICY "Hadith is public"
  ON hadith FOR SELECT
  USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_mosques_updated_at
  BEFORE UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Test Mosque
-- ============================================
INSERT INTO mosques (
  name,
  slug,
  city,
  country,
  latitude,
  longitude,
  madhab,
  calculation_method,
  jumuah_adhaan_time,
  jumuah_khutbah_time,
  timezone
) VALUES (
  'Test Masjid',
  'test-masjid',
  'Cape Town',
  'South Africa',
  -33.9249,
  18.4241,
  'hanafi',
  3,
  '12:45:00',
  '13:00:00',
  'Africa/Johannesburg'
);

-- ============================================
-- SEED DATA: Sample Hadith
-- ============================================
INSERT INTO hadith (text_english, text_arabic, source, reference, category) VALUES
(
  'The Prophet (peace be upon him) said: "The two rak''ahs of Fajr are better than the world and everything in it."',
  NULL,
  'Sahih Muslim',
  '725',
  'Prayer'
),
(
  'The Prophet (peace be upon him) said: "None of you truly believes until he loves for his brother what he loves for himself."',
  NULL,
  'Sahih Bukhari',
  '13',
  'Character'
),
(
  'The Prophet (peace be upon him) said: "The best of you are those who learn the Quran and teach it."',
  NULL,
  'Sahih Bukhari',
  '5027',
  'Quran'
),
(
  'The Prophet (peace be upon him) said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent."',
  NULL,
  'Sahih Bukhari',
  '6018',
  'Character'
),
(
  'The Prophet (peace be upon him) said: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry."',
  NULL,
  'Sahih Bukhari',
  '6114',
  'Character'
);
