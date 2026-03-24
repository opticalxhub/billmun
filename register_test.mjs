import { createClient } from '@supabase/supabase-js';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";

const supabase = createClient(url, key);
const BASE = 'http://localhost:3000';
const password = 'Pookie123!';

const accounts = [
  { label: 'DELEGATE',        email: 'testdel7@billmun.test',     full_name: 'Test Delegate',  department: 'DELEGATE',        preferred_committee: 'UNESCO', allocated_country: 'France' },
  { label: 'CHAIR',           email: 'testchair7@billmun.test',   full_name: 'Test Chair',     department: 'CHAIR',           preferred_committee: 'UNESCO', allocated_country: '' },
  { label: 'CO_CHAIR',        email: 'testcochair7@billmun.test', full_name: 'Test CoChair',   department: 'CO_CHAIR',        preferred_committee: 'UNESCO', allocated_country: '' },
  { label: 'ADMIN',           email: 'testadmin7@billmun.test',   full_name: 'Test Admin',     department: 'ADMIN',           preferred_committee: 'UNESCO', allocated_country: '' },
  { label: 'PRESS',           email: 'testpress7@billmun.test',   full_name: 'Test Press',     department: 'PRESS',           preferred_committee: '',       allocated_country: '' },
  { label: 'SECURITY',        email: 'testsec7@billmun.test',     full_name: 'Test Security',  department: 'SECURITY',        preferred_committee: '',       allocated_country: '' },
  { label: 'EXECUTIVE_BOARD', email: 'testeb7@billmun.test',      full_name: 'Test EB',        department: 'EXECUTIVE_BOARD', preferred_committee: '',       allocated_country: '' },
];

async function main() {
  const results = [];

  for (const acct of accounts) {
    console.log(`\n--- Registering ${acct.label}: ${acct.email} ---`);
    const body = {
      email: acct.email,
      password,
      full_name: acct.full_name,
      department: acct.department,
      date_of_birth: '2007-03-15',
      grade: '12',
      phone_number: '+971501234567',
      emergency_contact_name: 'Parent Name',
      emergency_contact_relation: 'Parent',
      emergency_contact_phone: '+971509876543',
      dietary_restrictions: 'None',
      preferred_committee: acct.preferred_committee || undefined,
      allocated_country: acct.allocated_country || undefined,
    };

    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        console.log(`  OK Registered: userId=${json.userId}`);
        results.push({ ...acct, userId: json.userId, ok: true });
      } else {
        console.log(`  FAIL: ${json.error}`);
        results.push({ ...acct, error: json.error, ok: false });
      }
    } catch (err) {
      console.log(`  NETWORK ERR: ${err.message}`);
      results.push({ ...acct, error: err.message, ok: false });
    }
  }

  console.log('\n\n=== REGISTRATION SUMMARY ===');
  for (const r of results) {
    console.log(`${r.ok ? 'OK' : 'FAIL'} ${r.label} (${r.email}): ${r.ok ? r.userId : r.error}`);
  }

  // Approve all registered users
  console.log('\n\n=== APPROVING ALL USERS ===');
  const successIds = results.filter(r => r.ok).map(r => r.userId);
  
  for (const uid of successIds) {
    const { error: upErr } = await supabase.from('users').update({ status: 'APPROVED' }).eq('id', uid);
    await supabase.auth.admin.updateUserById(uid, { email_confirm: true });
    console.log(upErr ? `  FAIL Approve ${uid}: ${upErr.message}` : `  OK Approved: ${uid}`);
  }

  console.log('\n\n=== ALL DONE ===');
  console.log('Password for all accounts: Pookie123!');
  console.log('\nLogin credentials:');
  for (const r of results.filter(r => r.ok)) {
    console.log(`  ${r.label}: ${r.email} / ${password}`);
  }
}

main().catch(console.error);
