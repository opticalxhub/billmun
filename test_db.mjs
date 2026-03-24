import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('get_pg_policies');
  if (error) {
    console.log("No rpc function. Looking at users table...");
    const { data: u, error: uErr } = await supabase.from('users').select('id').eq('id', '00000000-0000-0000-0000-000000000000');
    console.log("0-user exists?", u);
  } else {
    console.log("Policies:", data);
  }

  // Also manually test the assign_committee function for the 00-user
  console.log("Trying to insert committee_assignment for 0-actor:");
  const { data: ins, error: insErr } = await supabase.from('committee_assignments').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    committee_id: '00000000-0000-0000-0000-000000000000', // invalid UUIDs
    country: 'TEST',
    seat_number: 'TEST',
    assigned_by_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log("Insert result:", insErr ? insErr.message : "Success");
}
check();
