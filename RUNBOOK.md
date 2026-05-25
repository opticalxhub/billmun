# NXTPortal Production Runbook

This document provides essential instructions for maintaining, monitoring, and troubleshooting the NXTPortal production environment.

## 1. System Overview
NXTPortal is a Next.js 15+ application using Supabase for authentication and database services. It is designed for high-concurrency during Model United Nations conferences.

## 2. Monitoring & Observability
- **Error Tracking**: All critical API paths use `src/lib/logger.ts`. Check your log management system (e.g., Vercel Logs, Datadog) for `[ERROR]` or `[SECURITY]` tags.
- **Performance**: Monitor Vercel Speed Insights for Lighthouse scores. Target: 95+ Performance.
- **Database**: Use Supabase Dashboard to monitor CPU/RAM usage during peak session hours (e.g., during Roll Call or Resolution voting).

## 3. Incident Response
### 3.1. High Latency / Database Load
1. Check for long-running queries in the Supabase Dashboard.
2. Verify that `select('*')` is not being used in newly added components.
3. If necessary, scale Supabase compute resources via the project settings.

### 3.2. Authentication Failures
1. Verify Supabase Auth service status.
2. Check `api/auth/login` logs for mass brute-force attempts.
3. Middleware redirects unauthenticated traffic; ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel env vars.

### 3.3. Malicious Activity
1. Check `audit_logs` table for suspicious patterns (e.g., mass document uploads, multiple failed approval attempts).
2. Use the `SECURITY` logs in `logger.ts` to identify IP addresses or User IDs involved in unauthorized access attempts.

## 4. Maintenance Tasks
- **Dependency Scanning**: Run `npm audit` weekly and patch high/critical vulnerabilities.
- **Database Backups**: Supabase performs automatic daily backups. Ensure "Point-in-Time Recovery" is enabled for production.
- **Cache Invalidation**: If configuration changes (e.g., conference dates), the `staleTime` for TanStack Query is set to 5-10 minutes. Hard refresh or wait for cache expiry.

## 5. Deployment Checklist
- [ ] Environment variables set correctly in production.
- [ ] `NODE_ENV` set to `production`.
- [ ] CSP headers verified in `next.config.mjs`.
- [ ] Load testing passed for 500+ concurrent users.
- [ ] All `any` types in critical paths replaced with interfaces.

## 6. Recommended Database Indexes
To support 300+ concurrent users, ensure the following indexes are present in your Supabase SQL Editor:

```sql
-- Performance indexes for Dashboard Bootstrap
CREATE INDEX IF NOT EXISTS idx_committee_assignments_user_id ON public.committee_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_sessions_committee_id ON public.committee_sessions(committee_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_speeches_user_id ON public.speeches(user_id);
CREATE INDEX IF NOT EXISTS idx_bloc_members_user_id ON public.bloc_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- Performance indexes for Committee Roster and Blocs
CREATE INDEX IF NOT EXISTS idx_committee_assignments_committee_id ON public.committee_assignments(committee_id);
CREATE INDEX IF NOT EXISTS idx_bloc_members_bloc_id ON public.bloc_members(bloc_id);
CREATE INDEX IF NOT EXISTS idx_bloc_messages_bloc_id ON public.bloc_messages(bloc_id);
```
