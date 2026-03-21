import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('Seeding database with test data...');

  try {
    const password_hash = await bcrypt.hash('password123', 10);

    // 1. Create a Committee
    const committeeId = uuidv4();
    const { error: cErr } = await supabase.from('committees').insert({
      id: committeeId,
      name: 'Test Security Council',
      abbreviation: 'TSC',
      topic: 'Test Topic',
      description: 'A test committee for dashboard testing',
      max_delegates: 50,
      is_active: true,
    });
    if (cErr) throw new Error('Committee insert error: ' + cErr.message);

    // 2. Create Users (Delegate, Chair, Admin, Security, Media, EB)
    const roles = ['DELEGATE', 'CHAIR', 'ADMIN', 'SECURITY', 'MEDIA', 'EXECUTIVE_BOARD'];
    const users = roles.map((role, i) => ({
      id: uuidv4(),
      email: `test_${role.toLowerCase()}@billmun.sa`,
      full_name: `Test ${role}`,
      password_hash,
      role: role,
      status: 'APPROVED',
      grade: 'GRADE_11',
      phone_number: '+1234567890',
      emergency_contact_name: 'Test Emergency',
      emergency_contact_relation: 'PARENT',
      emergency_contact_phone: '+1234567890',
      has_completed_onboarding: true,
      badge_status: 'ACTIVE',
    }));

    const { error: uErr } = await supabase.from('users').insert(users);
    if (uErr) throw new Error('Users insert error: ' + uErr.message);

    // 3. Create Committee Assignments
    const assignments = users
      .filter((u) => u.role === 'DELEGATE' || u.role === 'CHAIR' || u.role === 'ADMIN')
      .map((u) => ({
        id: uuidv4(),
        user_id: u.id,
        committee_id: committeeId,
        country: u.role === 'DELEGATE' ? 'Test Country' : null,
      }));

    if (assignments.length > 0) {
      const { error: caErr } = await supabase.from('committee_assignments').insert(assignments);
      if (caErr) throw new Error('Committee assignments insert error: ' + caErr.message);
    }

    // 4. Create an Access Zone
    const zoneId = uuidv4();
    const { error: zErr } = await supabase.from('access_zones').insert({
      id: zoneId,
      name: 'Test Zone',
      description: 'Test zone description',
      capacity: 100,
      is_active: true,
      status: 'OPEN',
      authorized_roles: ['DELEGATE', 'CHAIR', 'ADMIN', 'SECURITY', 'MEDIA', 'EXECUTIVE_BOARD'],
    });
    if (zErr && !zErr.message.includes('relation "access_zones" does not exist')) {
        console.warn('Zone insert error (might not exist): ' + zErr.message);
    }

    console.log('Seed completed successfully!');
    console.log('Login credentials for all users: password = password123');
    users.forEach((u) => console.log(`- ${u.role}: ${u.email}`));

  } catch (error) {
    console.error('Seed failed:', error);
  }
}

main();
