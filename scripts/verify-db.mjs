import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlqtuynaxuooymbwrwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscXR1eW5heHVvb3ltYndyd3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczMDc0NCwiZXhwIjoyMDg1MzA2NzQ0fQ.dT2BlLDTn9XFrt2bzpzrQ0yALE1Fx7ElX_Mhw1ErWHM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('=== Database Verification ===\n');

  // Check mosques
  const { data: mosques, error: mosqueError } = await supabase
    .from('mosques')
    .select('*');

  if (mosqueError) {
    console.error('❌ Error fetching mosques:', mosqueError.message);
  } else {
    console.log(`✓ Mosques: ${mosques.length} found`);
    mosques.forEach(m => {
      console.log(`  - ${m.name} (${m.city}, ${m.madhab})`);
      console.log(`    Ramadan Mode: ${m.ramadan_mode ? 'ON' : 'OFF'}`);
    });
  }

  // Check hadith
  const { data: hadith, error: hadithError } = await supabase
    .from('hadith')
    .select('*');

  if (hadithError) {
    console.error('❌ Error fetching hadith:', hadithError.message);
  } else {
    console.log(`\n✓ Hadith: ${hadith.length} found`);
    hadith.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.source} (${h.reference}) - ${h.category}`);
    });
  }

  // Check subscribers
  const { count: subCount } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✓ Subscribers: ${subCount || 0}`);

  // Check messages
  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  console.log(`✓ Messages: ${msgCount || 0}`);

  // Check admins
  const { count: adminCount } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true });

  console.log(`✓ Admins: ${adminCount || 0}`);

  console.log('\n=== Verification Complete ===');
}

verify().catch(console.error);
