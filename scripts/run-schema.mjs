import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://jlqtuynaxuooymbwrwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscXR1eW5heHVvb3ltYndyd3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczMDc0NCwiZXhwIjoyMDg1MzA2NzQ0fQ.dT2BlLDTn9XFrt2bzpzrQ0yALE1Fx7ElX_Mhw1ErWHM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSchema() {
  console.log('Checking if tables already exist...');

  // Check if mosques table exists
  const { data: mosques, error: mosqueError } = await supabase
    .from('mosques')
    .select('id')
    .limit(1);

  if (!mosqueError) {
    console.log('Tables already exist! Checking for Test Masjid...');

    const { data: testMosque } = await supabase
      .from('mosques')
      .select('*')
      .eq('slug', 'test-masjid')
      .single();

    if (testMosque) {
      console.log('✓ Test Masjid already exists:', testMosque.name);
    } else {
      console.log('Test Masjid not found, inserting...');
      const { error: insertError } = await supabase
        .from('mosques')
        .insert({
          name: 'Test Masjid',
          slug: 'test-masjid',
          city: 'Cape Town',
          country: 'South Africa',
          latitude: -33.9249,
          longitude: 18.4241,
          madhab: 'hanafi',
          calculation_method: 3,
          jumuah_adhaan_time: '12:45:00',
          jumuah_khutbah_time: '13:00:00',
          timezone: 'Africa/Johannesburg'
        });

      if (insertError) {
        console.error('Error inserting mosque:', insertError);
      } else {
        console.log('✓ Test Masjid inserted');
      }
    }

    // Check hadith count
    const { count } = await supabase
      .from('hadith')
      .select('*', { count: 'exact', head: true });

    console.log(`✓ Hadith count: ${count || 0}`);

    if (!count || count === 0) {
      console.log('Inserting hadith...');
      const { error: hadithError } = await supabase
        .from('hadith')
        .insert([
          {
            text_english: 'The Prophet (peace be upon him) said: "The two rak\'ahs of Fajr are better than the world and everything in it."',
            source: 'Sahih Muslim',
            reference: '725',
            category: 'Prayer'
          },
          {
            text_english: 'The Prophet (peace be upon him) said: "None of you truly believes until he loves for his brother what he loves for himself."',
            source: 'Sahih Bukhari',
            reference: '13',
            category: 'Character'
          },
          {
            text_english: 'The Prophet (peace be upon him) said: "The best of you are those who learn the Quran and teach it."',
            source: 'Sahih Bukhari',
            reference: '5027',
            category: 'Quran'
          },
          {
            text_english: 'The Prophet (peace be upon him) said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent."',
            source: 'Sahih Bukhari',
            reference: '6018',
            category: 'Character'
          },
          {
            text_english: 'The Prophet (peace be upon him) said: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry."',
            source: 'Sahih Bukhari',
            reference: '6114',
            category: 'Character'
          }
        ]);

      if (hadithError) {
        console.error('Error inserting hadith:', hadithError);
      } else {
        console.log('✓ Hadith inserted');
      }
    }

    return;
  }

  console.log('Tables do not exist. You need to run the schema manually.');
  console.log('');
  console.log('Please follow these steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth/sql');
  console.log('2. Click "New query"');
  console.log('3. Copy the contents of supabase/schema.sql');
  console.log('4. Paste and click "Run"');
}

runSchema().catch(console.error);
