const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export function validateEnv() {
  if (process.env.NODE_ENV === 'development') return;

  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error(`[CRITICAL] Missing required environment variables: ${missing.join(', ')}`);
    // In production, we want to know this immediately
    if (typeof window === 'undefined') {
       // Server side - can throw to crash early
       // throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
