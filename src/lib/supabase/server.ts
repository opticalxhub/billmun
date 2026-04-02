import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

/**
 * Returns a Supabase client initialised with the **service-role key**.
 * Use this in every API route / server action so RLS is bypassed.
 *
 * The client is a singleton – safe to call many times per request.
 */
export function getServiceClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    );
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}
