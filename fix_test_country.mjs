import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const supabaseAdmin = createClient(url, key);

async function fixTestCountry() {
  const { data: assignments, error: aErr } = await supabaseAdmin
    .from('committee_assignments')
    .select('id, user_id, country')
    .eq('country', 'TEST_COUNTRY');
    
  if (assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      // Get the user's allocated country and assigned committee
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('allocated_country')
        .eq('id', assignment.user_id)
        .single();
        
      if (user && user.allocated_country) {
        await supabaseAdmin
          .from('committee_assignments')
          .update({ country: user.allocated_country, seat_number: null })
          .eq('id', assignment.id);
        console.log(`Reverted user ${assignment.user_id} back to ${user.allocated_country}`);
      } else {
        await supabaseAdmin
          .from('committee_assignments')
          .update({ country: 'France', seat_number: null })
          .eq('id', assignment.id);
        console.log(`Reverted user ${assignment.user_id} back to France`);
      }
    }
  } else {
    console.log("No TEST_COUNTRY found");
  }
}
fixTestCountry();
