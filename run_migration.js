import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

console.log('You need to run the migrations in supabase/migrations/ manually via Supabase SQL Editor.');

