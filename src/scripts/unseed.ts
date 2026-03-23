import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Removing test data...');

  try {
    // Delete test users (cascade should delete assignments)
    const { error: uErr } = await supabase
      .from('users')
      .delete()
      .like('email', 'test_%@billmun.sa');
    
    if (uErr) console.error('Error deleting users:', uErr.message);
    else console.log('Deleted test users');

    // Delete test committee
    const { error: cErr } = await supabase
      .from('committees')
      .delete()
      .eq('name', 'Test Security Council');
      
    if (cErr) console.error('Error deleting committee:', cErr.message);
    else console.log('Deleted test committee');

    // Delete test zone
    const { error: zErr } = await supabase
      .from('security_access_zones')
      .delete()
      .eq('name', 'Test Zone');
      
    if (zErr && !zErr.message.includes('relation "access_zones" does not exist')) {
        console.error('Error deleting zone:', zErr.message);
    } else {
        console.log('Deleted test zone');
    }

    console.log('Unseed completed successfully!');
  } catch (error) {
    console.error('Unseed failed:', error);
  }
}

main();
