import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const supabaseAdmin = createClient(url, key);

async function check() {
  console.log("Checking EB registrations join...");
  const { data, error } = await supabaseAdmin.from("users").select(`
    id, email, full_name,
    committee_assignments!committee_assignments_user_id_fkey(
      id, committee_id, country, seat_number,
      committees(id, name)
    )
  `).not('committee_assignments', 'is', null).limit(5);

  if (error) {
    console.error("Join error:", error);
    return;
  }

  console.log("Found", data.length, "users with assignments.");
  data.forEach(u => {
    console.log(`User: ${u.full_name} (${u.email})`);
    console.log(`Assignments:`, JSON.stringify(u.committee_assignments, null, 2));
  });
}
check();
