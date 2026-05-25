# NXTPortal Security Posture

This document summarizes the security controls and hardening measures implemented in NXTPortal.

## 1. Network & Transport
- **HSTS**: Strict-Transport-Security is enabled with a 1-year max-age and `includeSubDomains`.
- **HTTPS**: All traffic is forced to HTTPS via Next.js middleware and Vercel infrastructure.
- **CSP**: Content-Security-Policy is enforced in `next.config.mjs` to prevent XSS and data exfiltration.

## 2. Authentication & Authorization
- **RBAC**: Role-Based Access Control is enforced at both the Middleware level and the API level using `getRequestUserContext`.
- **Session Security**: Cookies are `HttpOnly`, `Secure`, and `SameSite=Lax`.
- **Identity Protection**: Mutating API routes derive user identity from the server-side JWT session, preventing client-side ID spoofing.

## 3. Input & Data Security
- **Validation**: All critical mutating routes (Register, Document Submission, Approval) use `Zod` schemas in `src/lib/validations.ts` for strict input validation.
- **Sanitization**: Output encoding is handled automatically by React/Next.js to prevent XSS.
- **Wildcard Prevention**: Wildcard `select('*')` is avoided in database queries to minimize data exposure and coupling.

## 4. Operational Security
- **Audit Logging**: All sensitive administrative actions (Approvals, Rejections, Critical Settings changes) are recorded in the `audit_logs` table.
- **Rate Limiting**: Handled via Vercel Edge Middleware or Supabase Auth rate limits.
- **Dependency Management**: Automated scanning for vulnerable packages.

## 5. Vulnerability Mitigation
- **XSS**: Mitigated by CSP and React's automatic escaping.
- **CSRF**: Mitigated by `SameSite` cookie policies and custom headers for API calls.
- **SQL Injection**: Prevented by the use of PostgREST (Supabase) which uses parameterized queries.
- **Brute Force**: Supabase Auth rate limiting on login/register endpoints.
