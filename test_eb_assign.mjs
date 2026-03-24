import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const supabaseAdmin = createClient(url, key);

async function check() {
  const { data: users } = await supabaseAdmin.from('users').select('id, full_name, email, role').limit(10);
  const { data: committees } = await supabaseAdmin.from('committees').select('id, name').limit(1);
  
  if (!users || users.length === 0 || !committees || committees.length === 0) {
      console.log("No data found");
      return;
  }
  
  const user = users[0];
  const committee = committees[0];
  
  console.log("Testing insert on user_id:", user.id, "committee_id:", committee.id);
  
  const { data, error } = await supabaseAdmin.from('committee_assignments').insert({
      user_id: user.id,
      committee_id: committee.id,
      country: 'TEST_COUNTRY',
      seat_number: 'TEST_SEAT',
      assigned_by_id: '00000000-0000-0000-0000-000000000000'
  });
  
  console.log("INSERT ERROR:", error);
}
check();
