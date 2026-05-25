# Portal Audit Findings

Date: 2026-05-25

## High Priority Findings

1. Authentication entry flow was inconsistent.
   - Unauthenticated users could still land on `/` instead of the login screen.
   - Post-login routing logic was duplicated across middleware and client pages.
   - Implemented: middleware now sends unauthenticated `/` traffic to `/login`, authenticated users are redirected away from `/`, `/login`, and `/login/eb` to their role home, and the login API now returns a role-aware `redirectTo`.

2. Dashboard session controls were inconsistent.
   - Shared EB dashboard layout exposed `Exit` links in multiple responsive variants.
   - Implemented: removed the shared `Exit` links from `src/components/eb-layout.tsx`.

3. Issue reporting trusted client-supplied identity fields.
   - The report API accepted `user_id` and `user_details` from the browser, which allowed identity spoofing in stored reports and urgent notifications.
   - Implemented: server now derives the reporting user from the authenticated context, sanitizes free-text fields, and uses `crypto.randomUUID()` for report IDs.

## High Priority

4. Over-fetching is widespread.
   - Many frontend and API paths use `select('*')`, increasing payload size and coupling UI code to full table schemas.
   - Examples include `src/components/navigation.tsx`, `src/app/api/users/me/route.ts`, `src/app/api/delegate/dashboard/route.ts`, and multiple dashboard tabs.
   - Recommendation: replace wildcard selects with explicit columns for every hot path.

5. Type safety debt is high.
   - Static scan found 229 `any` usages across 50 files.
   - This weakens editor diagnostics and makes auth, messaging, and dashboard data flows harder to refactor safely.
   - Recommendation: prioritize shared API response types, dashboard context types, and form payload types.

6. Client-side data orchestration is heavy in several dashboards.
   - Large dashboard pages still coordinate multiple Supabase requests in client components, which increases time-to-interactive and duplicates server authorization logic.
   - Recommendation: move hot dashboard aggregations into server route handlers or server components with narrower payloads.

## Medium Priority

7. Representative API validation is uneven.
   - Some endpoints validate payloads carefully, but others still accept loosely shaped request bodies.
   - Recommendation: adopt a shared schema validation approach for all mutating routes.

8. The root marketing page remains a very large client-rendered surface.
   - It bundles animation logic, gallery fetching, and interactive UI into the default app entry.
   - Recommendation: split non-critical sections, lazy-load media-heavy regions, and reduce client-only work above the fold.

9. Notifications and dashboard data rely on repeated polling/revalidation patterns.
   - Recommendation: centralize cache policy, set deliberate stale times, and reduce duplicate fetches between shells and tab content.

## Production Readiness Gaps Not Fully Closed In This Pass

- No completed load test proving 300 concurrent users in the current environment.
- No end-to-end verification of all protected route permutations.
- No full WCAG audit or design-system accessibility sweep.
- No comprehensive backend observability rollout for every API path.
