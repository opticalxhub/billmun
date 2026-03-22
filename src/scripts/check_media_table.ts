import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { error } = await supabase.from('media_gallery').select('id').limit(1);
  if (error) {
    console.error('media_gallery check failed:', error);
  } else {
    console.log('media_gallery check passed');
  }

  const { error: assetsErr } = await supabase.from('media_assets').select('id').limit(1);
  if (assetsErr) {
    console.error('media_assets check failed:', assetsErr);
  } else {
    console.log('media_assets check passed');
  }
}

check();
