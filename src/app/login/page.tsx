"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { gsap } from "gsap";

/* ─────────────────────────────────────────────────────────────────────
   LoginPage — BILLMUN portal authentication
   Aesthetic: espionage dossier, dark corkboard background, rust accent
   ───────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const wrapperRef  = useRef<HTMLDivElement>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const logoRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLDivElement>(null);
  const formRef     = useRef<HTMLFormElement>(null);

  /* ── Entrance animations ─────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        cardRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.1 }
      )
        .fromTo(
          logoRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          titleRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45 },
          "-=0.25"
        )
        .fromTo(
          Array.from(formRef.current?.querySelectorAll(".form-field") ?? []),
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 },
          "-=0.2"
        );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  /* ── Login handler ───────────────────────────────────────────────── */
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
              ? "Login response was invalid. Try again or hard-refresh the page."
              : "Login failed (server error). Clear .next and restart the dev server if this persists."
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
      ref={wrapperRef}
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* ── Background corkboard atmosphere ────────────────────────── */}
      <CorkboardBackground />

      {/* ── Login card ─────────────────────────────────────────────── */}
      <div ref={cardRef} className="relative z-10 w-full max-w-[380px]">
        {/* Red pin at top-center */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="pin-dot w-3 h-3 animate-pin-drop" aria-hidden />
        </div>

        <div
          className="paper-card relative px-8 py-10 overflow-hidden"
          style={{
            transform: "rotate(-0.3deg)",
          }}
        >
          {/* Subtle grain */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
              opacity: 0.04,
              mixBlendMode: "overlay",
            }}
            aria-hidden
          />

          {/* CONFIDENTIAL watermark stamp */}
          <div
            className="absolute top-5 right-4 select-none pointer-events-none"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "var(--rust-600)",
              border: "1.5px solid var(--rust-700)",
              padding: "2px 6px",
              transform: "rotate(6deg)",
              opacity: 0.35,
            }}
            aria-hidden
          >
            RESTRICTED ACCESS
          </div>

          {/* ── Logo ─────────────────────────────────────────────── */}
          <div ref={logoRef} className="flex justify-center mb-8">
            <Link href="/" aria-label="Back to BILLMUN homepage">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ln71YRUCH1P6UVdkaMFhJ890w8Sr4q.png"
                alt="BILLMUN logo"
                width={72}
                height={72}
                className="w-16 h-16 object-contain hover:scale-105 transition-transform duration-300"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* ── Title ────────────────────────────────────────────── */}
          <div ref={titleRef} className="text-center mb-8">
            <h1
              className="text-2xl font-condensed font-700 uppercase tracking-[0.3em]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-barlow-condensed)" }}
            >
              PORTAL LOGIN
            </h1>
            <div
              className="mt-2 h-px w-16 mx-auto"
              style={{ backgroundColor: "var(--rust-600)", opacity: 0.6 }}
            />
            <p
              className="mt-2 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            >
              BILLMUN CONFERENCE SYSTEM
            </p>
          </div>

          {/* ── Form ─────────────────────────────────────────────── */}
          <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
            <div className="form-field">
              <label
                htmlFor="login-email"
                className="block mb-2 uppercase tracking-[0.16em]"
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-barlow-condensed)",
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 px-4 text-sm transition-all"
                style={{
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-emphasized)",
                  borderRadius: "3px",
                  fontFamily: "var(--font-barlow)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--rust-500)";
                  e.target.style.boxShadow = "0 0 0 1px var(--rust-700)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-emphasized)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="form-field">
              <label
                htmlFor="login-password"
                className="block mb-2 uppercase tracking-[0.16em]"
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-barlow-condensed)",
                }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full h-11 px-4 text-sm transition-all"
                style={{
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-emphasized)",
                  borderRadius: "3px",
                  fontFamily: "var(--font-barlow)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--rust-500)";
                  e.target.style.boxShadow = "0 0 0 1px var(--rust-700)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-emphasized)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Error / success feedback */}
            {error && (
              <div
                className="form-field text-sm px-4 py-3"
                style={{
                  color: "var(--status-rejected-text)",
                  backgroundColor: "var(--status-rejected-bg)",
                  border: "1px solid var(--status-rejected-border)",
                  borderRadius: "3px",
                  fontFamily: "var(--font-barlow)",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="form-field text-sm px-4 py-3"
                style={{
                  color: "var(--status-approved-text)",
                  backgroundColor: "var(--status-approved-bg)",
                  border: "1px solid var(--status-approved-border)",
                  borderRadius: "3px",
                  fontFamily: "var(--font-barlow)",
                }}
                role="status"
              >
                Authentication confirmed. Redirecting...
              </div>
            )}

            {/* Submit button */}
            <div className="form-field pt-1">
              <button
                type="submit"
                disabled={loading || success}
                className="relative w-full h-11 overflow-hidden transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: loading || success ? "var(--rust-700)" : "var(--rust-500)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--rust-600)",
                  borderRadius: "3px",
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !success) {
                    (e.target as HTMLButtonElement).style.backgroundColor = "var(--rust-400)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !success) {
                    (e.target as HTMLButtonElement).style.backgroundColor = "var(--rust-500)";
                  }
                }}
              >
                {success ? "Redirecting..." : loading ? "Authenticating..." : "Access Portal"}
              </button>
            </div>
          </form>

          {/* ── Footer links ─────────────────────────────────────── */}
          <div className="mt-7 pt-6 space-y-3 text-center"
            style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Link
              href="/register"
              className="block text-[11px] uppercase tracking-[0.14em] transition-colors"
              style={{
                color: "var(--text-rust)",
                fontFamily: "var(--font-barlow-condensed)",
                fontWeight: 700,
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "var(--rust-300)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "var(--text-rust)")
              }
            >
              Register for an account
            </Link>
            <Link
              href="/"
              className="block text-[10px] uppercase tracking-[0.2em] transition-colors"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-barlow-condensed)",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "var(--text-secondary)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "var(--text-tertiary)")
              }
            >
              Back to Home
            </Link>
          </div>

          {/* Bottom monospace file label */}
          <div
            className="mt-6 text-center"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--text-disabled)",
              letterSpacing: "0.1em",
            }}
          >
            FILE: BILLMUN-AUTH-001 &bull; LEVEL 3 CLEARANCE REQUIRED
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CorkboardBackground — atmospheric espionage backdrop
   Scattered "files" pinned in the bg, slightly blurred
   ───────────────────────────────────────────────────────────────────── */
function CorkboardBackground() {
  const bgFiles = [
    { top: "8%",  left: "3%",   rotate: "-4deg",  w: 120, label: "CRISIS",    opacity: 0.14 },
    { top: "5%",  left: "28%",  rotate: "2deg",   w: 150, label: "CONF. FILES", opacity: 0.12 },
    { top: "12%", left: "68%",  rotate: "-2deg",  w: 110, label: "WHO",        opacity: 0.11 },
    { top: "38%", left: "1%",   rotate: "3deg",   w: 100, label: "USA",        opacity: 0.1  },
    { top: "42%", left: "72%",  rotate: "-3deg",  w: 130, label: "ICJ",        opacity: 0.12 },
    { top: "65%", left: "5%",   rotate: "-1deg",  w: 140, label: "SPECIAL",    opacity: 0.1  },
    { top: "70%", left: "35%",  rotate: "2deg",   w: 110, label: "APBUNCA",    opacity: 0.09 },
    { top: "72%", left: "60%",  rotate: "-2deg",  w: 160, label: "COMMITTEE",  opacity: 0.11 },
    { top: "85%", left: "2%",   rotate: "1deg",   w: 120, label: "DELEGATES",  opacity: 0.09 },
    { top: "88%", left: "50%",  rotate: "-1deg",  w: 110, label: "MEDIA",      opacity: 0.1  },
    { top: "87%", left: "75%",  rotate: "2deg",   w: 140, label: "ADMIN",      opacity: 0.09 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base cork tint */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(139,69,19,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 85%, rgba(160,82,45,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.2) 0%, transparent 80%)
          `,
        }}
      />

      {/* Background "files" scattered on cork */}
      {bgFiles.map((file, i) => (
        <div
          key={i}
          className="absolute select-none"
          style={{
            top: file.top,
            left: file.left,
            width: `${file.w}px`,
            transform: `rotate(${file.rotate})`,
            opacity: file.opacity,
            filter: "blur(0.8px)",
          }}
        >
          {/* Pin */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, #d4602a, var(--pin-rust))",
            }}
          />
          {/* File card */}
          <div
            style={{
              backgroundColor: "var(--paper-aged)",
              border: "1px solid var(--paper-border)",
              padding: "8px 10px 12px",
              minHeight: "60px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              {file.label}
            </div>
            {/* Redaction lines */}
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              {[0.6, 0.4, 0.55].map((w, j) => (
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

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
