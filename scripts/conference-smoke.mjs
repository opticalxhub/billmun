#!/usr/bin/env node
/**
 * Conference smoke checks (public routes + API contracts).
 * Run with the app up: npm run start  (or dev) then: npm run smoke
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npm run smoke
 *   BASE_URL=https://your-domain.com npm run smoke
 */

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const TIMEOUT_MS = 15_000;

async function fetchOk(label, path, init = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(t);
    return { label, path, ok: true, status: res.status, url };
  } catch (e) {
    clearTimeout(t);
    const msg = e?.name === "AbortError" ? `timeout ${TIMEOUT_MS}ms` : e?.message || String(e);
    return { label, path, ok: false, status: null, error: msg, url };
  }
}

function expectStatus(result, allowed) {
  if (!result.ok) return { ...result, pass: false, reason: result.error || "fetch failed" };
  const pass = allowed.includes(result.status);
  return { ...result, pass, reason: pass ? "" : `got ${result.status}, want one of ${allowed.join(",")}` };
}

async function main() {
  console.log(`Conference smoke against ${BASE}\n`);

  const results = [];

  const checks = [
    () => expectStatus(await fetchOk("home", "/"), [200]),
    () => expectStatus(await fetchOk("login page", "/login"), [200]),
    () => expectStatus(await fetchOk("register page", "/register"), [200]),
    () => expectStatus(await fetchOk("gallery page", "/gallery"), [200]),
    () => expectStatus(await fetchOk("contact page", "/contact"), [200]),
    () => expectStatus(await fetchOk("manifest", "/manifest.json"), [200]),
    () =>
      expectStatus(
        await fetchOk("api conference-status", "/api/config/conference-status"),
        [200],
      ),
    () =>
      expectStatus(
        await fetchOk("api public-settings", "/api/config/public-settings"),
        [200],
      ),
    () =>
      expectStatus(await fetchOk("api announcements", "/api/announcements/public"), [200]),
    () => expectStatus(await fetchOk("api gallery", "/api/gallery"), [200]),
    () =>
      expectStatus(
        await fetchOk("api committees", "/api/committees"),
        [200],
      ),
    () =>
      expectStatus(
        await fetchOk("login POST empty body", "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
        [400],
      ),
    () =>
      expectStatus(
        await fetchOk("register POST empty body", "/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
        [400],
      ),
    () =>
      expectStatus(
        await fetchOk("delegate dashboard unauth", "/api/delegate/dashboard", {
          headers: { Accept: "application/json" },
        }),
        [401, 400],
      ),
  ];

  for (const run of checks) {
    const r = await run();
    results.push(r);
    const icon = r.pass ? "OK " : "FAIL";
    console.log(
      `${icon}  ${r.label}  ${r.status ?? "-"}  ${r.reason ? `(${r.reason})` : ""}`,
    );
  }

  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log(
      `\n${failed.length} check(s) failed. If every request failed, start the server: npm run start`,
    );
    process.exit(1);
  }
  console.log("\nAll public smoke checks passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
