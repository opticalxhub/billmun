import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const s = createClient(url, key);

async function check() {
  const { data: admins } = await s.from('users').select('id, full_name, email, role, status').eq('role', 'ADMIN');
  console.log('--- Admins ---');
  console.log(JSON.stringify(admins, null, 2));

  if (admins && admins.length > 0) {
    const { data: adminAssigns } = await s.from('committee_assignments').select('user_id, committee_id, committees(name), country').in('user_id', admins.map(a => a.id));
    console.log('--- Admin Assignments ---');
    console.log(JSON.stringify(adminAssigns, null, 2));
  }

  const { data: delegates } = await s.from('committee_assignments').select('user_id, committee_id, committees(name), country, users(full_name, role, status)');
  console.log('--- All Delegate Assignments (Top 20) ---');
  console.log(JSON.stringify(delegates?.filter(d => d.users?.role === 'DELEGATE').slice(0, 20), null, 2));

  const { data: committees } = await s.from('committees').select('id, name, abbreviation');
  console.log('--- Committees ---');
  console.log(JSON.stringify(committees, null, 2));
}

check();
