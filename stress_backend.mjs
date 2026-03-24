import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = "https://qmmgugalvcgaxvgsfslp.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y";
const supabase = createClient(url, key);

async function runTests() {
  const usersToTest = [
    { email: 'testdel7@billmun.test', role: 'DELEGATE' },
    { email: 'testchair7@billmun.test', role: 'CHAIR' },
    { email: 'testeb7@billmun.test', role: 'EXECUTIVE_BOARD' },
    { email: 'testsecurity7@billmun.test', role: 'SECURITY' }
  ];

  const report = {};

  for (let u of usersToTest) {    
    const { data: user, error: userErr } = await supabase.from('users').select('*').eq('email', u.email).single();
    if (!user) {
        report[u.role] = { error: "User not found!" };
        continue;
    }
    const ctx = { user_id: user.id };
    const errors = [];
    const successes = [];

    if (u.role === 'DELEGATE') {
      const sRes = await supabase.from('speeches').insert({ user_id: ctx.user_id, title: 'Stress Test Speech', body: 'This is a test speech', word_count: 5 }).select().single();
      if (sRes.error) errors.push(`Create Speech: ${sRes.error.message}`);
      else { successes.push("Speeches"); await supabase.from('speeches').delete().eq('id', sRes.data.id); }

      const rRes = await supabase.from('resolutions').insert({ user_id: ctx.user_id, title: 'Test Res', topic: 'Testing', is_manual: false, co_sponsors: [] }).select().single();
      if (rRes.error) errors.push(`Create Resolution: ${rRes.error.message}`);
      else {
        const cRes = await supabase.from('resolution_clauses').insert({ resolution_id: rRes.data.id, type: 'OPERATIVE', opening_phrase: 'Calls upon', content: 'the tester', order_index: 0 }).select().single();
        if (cRes.error) errors.push(`Create Clause: ${cRes.error.message}`);
        else successes.push("Resolutions & Clauses");
        await supabase.from('resolutions').delete().eq('id', rRes.data.id);
      }

      const bRes = await supabase.from('blocs').insert({ creator_id: ctx.user_id, name: 'Test Bloc', invite_code: 'TEST01' }).select().single();
      if (bRes.error) errors.push(`Create Bloc: ${bRes.error.message}`);
      else {
        successes.push("Blocs");
        const msgRes = await supabase.from('bloc_messages').insert({ bloc_id: bRes.data.id, user_id: ctx.user_id, content: 'Stress Test Message!' });
        if (msgRes.error) errors.push(`Send Bloc Message: ${msgRes.error.message}`);
        await supabase.from('blocs').delete().eq('id', bRes.data.id);
      }
    }
    else if (u.role === 'CHAIR') {
      const { data: assignment } = await supabase.from('committee_assignments').select('committee_id').eq('user_id', ctx.user_id).single();
      if (!assignment) {
        errors.push("No chair assignment found.");
      } else {
        const pRes = await supabase.from('delegate_presence_statuses').upsert({ committee_id: assignment.committee_id, user_id: ctx.user_id, status: 'PRESENT' }, { onConflict: 'committee_id,user_id' });
        if (pRes.error) errors.push(`Roll Call: ${pRes.error.message}`);
        else successes.push("Roll Call Presence Upserts");
        
        const nRes = await supabase.from('admin_chair_notes').upsert({ committee_id: assignment.committee_id, sender_id: ctx.user_id, content: "Test Admin Note" }, { onConflict: 'committee_id' });
        if (nRes.error) errors.push(`Admin Chair Notes: ${nRes.error.message}`);
        else successes.push("Shared Admin Notepad");
      }
    }
    else if (u.role === 'SECURITY') {
        const { data: pass } = await supabase.from('digital_passes').select('*').limit(1);
        if (pass && pass.length > 0) {
           const logRes = await supabase.from('security_scans').insert({ passthrough_id: pass[0].id, scanner_id: ctx.user_id, status: 'ALLOWED' });
           if (logRes.error) errors.push(`Security Scan Log: ${logRes.error.message}`);
           else successes.push("Security Scanning & Logging");
        } else successes.push("No digital passes to test scan");
    }

    report[u.role] = { successes, errors };
  }
  fs.writeFileSync('stress_results.json', JSON.stringify(report, null, 2), 'utf8');
}
runTests().catch(console.error);
