"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────────────────
   LoginPage — NXTMUN
   Split screen: left = massive typographic statement
                 right = stripped form, minimal
   Inspired by: landonorris.com — space, type, restraint
   ───────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const raw = await res.text();
      let data: { error?: string; session?: { access_token: string; refresh_token: string } } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          setError(
            res.ok
              ? "Login response was invalid. Try again."
              : "Login failed. Try again."
          );
          setLoading(false);
          return;
        }
      }

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setSuccess(true);
      window.location.href = "/dashboard";
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* ── LEFT PANEL — typographic statement ─────────────────────── */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-14 xl:p-20"
        style={{ borderRight: "1px solid var(--border-subtle)" }}
      >
        {/* Logo + wordmark — top left */}
        <Link href="/" className="flex items-center gap-3 group w-fit" aria-label="NXTMUN home">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ln71YRUCH1P6UVdkaMFhJ890w8Sr4q.png"
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            unoptimized
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            NXTMUN
          </span>
        </Link>

        {/* Main typographic block — center of vertical space */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h1
            className="font-condensed uppercase"
            style={{
              fontSize: "clamp(3.5rem, 7vw, 6rem)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Portal
            <br />
            Access
          </h1>

          {/* Rust rule */}
          <div
            className="mt-8"
            style={{ width: "40px", height: "2px", backgroundColor: "var(--rust-400)" }}
          />

          {/* Tagline */}
          <div className="mt-8 flex flex-col gap-2">
            {[
              { letter: "N", word: "Navigate" },
              { letter: "X", word: "Execute" },
              { letter: "T", word: "Transform" },
            ].map(({ letter, word }) => (
              <div key={letter} className="flex items-baseline gap-3">
                <span
                  style={{
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "var(--rust-400)",
                    width: "12px",
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {word}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — classified label */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-disabled)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
          aria-hidden
        >
          Conference System &bull; Authorized Access Only
        </div>

        {/* Background atmospheric elements */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          {/* Scattered redacted file cards — very faint */}
          {[
            { top: "12%", left: "8%",  rotate: "-4deg", w: 90,  opacity: 0.06 },
            { top: "8%",  left: "55%", rotate: "2deg",  w: 110, opacity: 0.05 },
            { top: "45%", left: "72%", rotate: "-2deg", w: 80,  opacity: 0.05 },
            { top: "72%", left: "10%", rotate: "3deg",  w: 100, opacity: 0.06 },
            { top: "80%", left: "60%", rotate: "-1deg", w: 85,  opacity: 0.04 },
          ].map((f, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: f.top,
                left: f.left,
                width: `${f.w}px`,
                transform: `rotate(${f.rotate})`,
                opacity: f.opacity,
              }}
            >
              <div
                style={{
                  backgroundColor: "var(--paper-aged)",
                  border: "1px solid var(--paper-border)",
                  padding: "8px 10px 12px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {[0.65, 0.42, 0.55].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        height: "2px",
                        width: `${w * 100}%`,
                        backgroundColor: "var(--border-emphasized)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Pin connector strings */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.04 }}
            aria-hidden
          >
            <line x1="12%" y1="15%" x2="60%" y2="11%" stroke="var(--rust-400)" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="60%" y1="11%" x2="75%" y2="47%" stroke="var(--rust-400)" strokeWidth="0.5" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ─────────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 md:px-12 lg:px-16 xl:px-24 py-20">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-12">
          <Link href="/" className="flex items-center gap-3 w-fit" aria-label="NXTMUN home">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ln71YRUCH1P6UVdkaMFhJ890w8Sr4q.png"
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
              unoptimized
              aria-hidden
            />
            <span
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                color: "var(--text-primary)",
                textTransform: "uppercase",
              }}
            >
              NXTMUN
            </span>
          </Link>
        </div>

        <div
          className="w-full"
          style={{
            maxWidth: "380px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }}
        >
          {/* Section label */}
          <p
            className="mb-8"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-rust)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Sign in
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-6" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 px-4 w-full"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-input)",
                  borderRadius: "2px",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 180ms ease, box-shadow 180ms ease",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "var(--rust-500)";
                  e.target.style.boxShadow = "0 0 0 1px var(--rust-800)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "var(--border-input)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-password"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="h-11 px-4 w-full"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-input)",
                  borderRadius: "2px",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 180ms ease, box-shadow 180ms ease",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "var(--rust-500)";
                  e.target.style.boxShadow = "0 0 0 1px var(--rust-800)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "var(--border-input)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3"
                role="alert"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "13px",
                  color: "var(--status-rejected-text)",
                  backgroundColor: "var(--status-rejected-bg)",
                  border: "1px solid var(--status-rejected-border)",
                  borderRadius: "2px",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="px-4 py-3"
                role="status"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "13px",
                  color: "var(--status-approved-text)",
                  backgroundColor: "var(--status-approved-bg)",
                  border: "1px solid var(--status-approved-border)",
                  borderRadius: "2px",
                  lineHeight: 1.5,
                }}
              >
                Confirmed. Redirecting&hellip;
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="h-11 w-full transition-all active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                backgroundColor: loading || success ? "var(--rust-700)" : "var(--rust-500)",
                border: "1px solid var(--rust-400)",
                borderRadius: "2px",
                cursor: loading || success ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                if (!loading && !success)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--rust-400)";
              }}
              onMouseLeave={e => {
                if (!loading && !success)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--rust-500)";
              }}
            >
              {success ? "Redirecting…" : loading ? "Authenticating…" : "Access Portal"}
            </button>
          </form>

          {/* Footer links */}
          <div
            className="mt-8 pt-6 flex flex-col gap-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <Link
              href="/register"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                color: "var(--text-rust)",
                transition: "color 180ms ease",
              }}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = "var(--rust-300)")}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = "var(--text-rust)")}
            >
              Register for an account &rarr;
            </Link>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                color: "var(--text-tertiary)",
                transition: "color 180ms ease",
              }}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = "var(--text-secondary)")}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = "var(--text-tertiary)")}
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
