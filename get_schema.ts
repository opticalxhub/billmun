import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchema() {
  console.log('Fetching database schema via PostgREST metadata...');
  
  // Since we can't query information_schema directly via PostgREST easily,
  // we'll try to infer it from the tables we know should exist from the migrations.
  const tablesToCheck = [
    'users', 'committees', 'committee_assignments', 'documents', 'ai_feedback',
    'announcements', 'notifications', 'audit_logs', 'conference_settings',
    'committee_sessions', 'speeches', 'blocs', 'bloc_members', 'bloc_messages',
    'bloc_documents', 'resolutions', 'resolution_clauses', 'country_research',
    'stance_notes', 'incidents', 'roll_calls', 'speakers_list', 'points_and_motions',
    'session_events', 'timer_logs'
  ];

  const schema: Record<string, string[]> = {};

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log(`Table ${table} does not exist.`);
      } else {
        console.error(`Error fetching table ${table}:`, error.message);
      }
      continue;
    }

    if (data && data.length > 0) {
      schema[table] = Object.keys(data[0]);
    } else {
      // If table is empty, we can't get keys via select *
      // Try to insert a dummy row and rollback? No, too risky.
      schema[table] = ['(Empty table - could not infer columns)'];
    }
  }

  console.log(JSON.stringify(schema, null, 2));
}

getSchema();
