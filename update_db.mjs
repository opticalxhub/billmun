import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Updating conference settings...');
  const { data, error } = await supabase
    .from('conference_settings')
    .update({ conference_date: '2026-04-03' })
    .eq('id', '1');

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Update successful, data:', data);
  }
}

run();
