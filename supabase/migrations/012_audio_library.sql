-- Audio Library tables for mosque audio content (lectures, tafsir, seerah, etc.)

-- Collections (folders)
CREATE TABLE IF NOT EXISTS audio_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_collections_mosque_id ON audio_collections(mosque_id);

-- Audio files
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES audio_collections(id) ON DELETE CASCADE,
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  speaker TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- seconds, extracted client-side
  file_type TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_files_collection_id ON audio_files(collection_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_mosque_id ON audio_files(mosque_id);

-- Enable RLS
ALTER TABLE audio_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can browse/stream)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for audio_collections') THEN
    CREATE POLICY "Public read access for audio_collections"
      ON audio_collections FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for audio_files') THEN
    CREATE POLICY "Public read access for audio_files"
      ON audio_files FOR SELECT USING (true);
  END IF;
END $$;

-- Service role has full access (admin operations go through supabaseAdmin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access for audio_collections') THEN
    CREATE POLICY "Service role full access for audio_collections"
      ON audio_collections FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access for audio_files') THEN
    CREATE POLICY "Service role full access for audio_files"
      ON audio_files FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Storage bucket for audio files
-- NOTE: Create the 'audio' bucket manually in Supabase Dashboard:
--   Name: audio
--   Public: true
--   File size limit: 500MB (524288000 bytes)
--   Allowed MIME types: all audio/* (or remove restriction entirely)
--     If restricting, include at minimum: audio/mpeg, audio/mp4, audio/x-m4a, audio/aac,
--     audio/ogg, audio/opus, audio/wav, audio/x-wav, audio/webm
