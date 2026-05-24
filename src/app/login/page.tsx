"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  NxtmunMark,
  MonoLabel,
  StampBadge,
  HRule,
  NoiseOverlay,
} from "@/components/nxtmun/primitives";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
          data = JSON.parse(raw);
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
    <div className="relative min-h-screen bg-bg-base text-paper grid lg:grid-cols-2">
      <NoiseOverlay intensity="default" />

      {/* ===== LEFT — File index ===== */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-border-subtle p-12 relative overflow-hidden bg-bg-card/30">
        <div className="absolute inset-0 nxt-scanlines pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, var(--nxt-paper) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--nxt-blood) 0, transparent 40%)",
          }}
        />

        <div className="relative">
          <NxtmunMark size="lg" withTagline />
        </div>

        <div className="relative space-y-8 max-w-md">
          <div>
            <MonoLabel tone="blood" className="mb-3 block">// PORTAL ACCESS</MonoLabel>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05]">
              The dossier <span className="italic">awaits</span>.
            </h1>
            <p className="mt-4 font-mono text-[13px] text-paper-soft leading-relaxed">
              Sign in to access committee files, position papers, blocs, and the live debate
              record. Every action is logged.
            </p>
          </div>

          <HRule />

          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <MonoLabel className="block mb-2">// CLEARANCE</MonoLabel>
              <p className="font-mono text-[12px] text-paper-soft">
                Delegate / Chair / Press / Admin / Security
              </p>
            </div>
            <div>
              <MonoLabel className="block mb-2">// EDITION</MonoLabel>
              <p className="font-mono text-[12px] text-paper-soft">I — 03–04 April 2026</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between">
          <MonoLabel>FILE-NXT-2026 / AUTH-001</MonoLabel>
          <StampBadge variant="blood">CONFIDENTIAL</StampBadge>
        </div>
      </aside>

      {/* ===== RIGHT — Form ===== */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <div className="lg:hidden mb-10 flex items-center justify-between">
            <NxtmunMark size="md" />
            <StampBadge variant="blood">CONFIDENTIAL</StampBadge>
          </div>

          <div className="mb-8">
            <MonoLabel tone="blood" className="mb-3 block">// PORTAL LOGIN</MonoLabel>
            <h2 className="font-display text-3xl md:text-4xl">Authenticate.</h2>
            <p className="font-mono text-[12px] text-paper-mute mt-2">
              Use the credentials you registered with.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block font-mono uppercase tracking-[0.20em] text-[10px] text-paper-mute mb-2"
              >
                // Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-12 bg-bg-card border border-border-emphasized px-4 font-mono text-[13px] text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block font-mono uppercase tracking-[0.20em] text-[10px] text-paper-mute mb-2"
              >
                // Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-12 bg-bg-card border border-border-emphasized px-4 font-mono text-[13px] text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="border border-blood-deep bg-blood/[0.08] px-4 py-3 font-mono text-[12px] text-blood-bright leading-relaxed"
              >
                <span className="font-bold uppercase tracking-[0.18em] text-[10px] block mb-1">
                  // ERROR
                </span>
                {error}
              </div>
            )}

            {success && (
              <div className="border border-paper/40 bg-paper/[0.05] px-4 py-3 font-mono text-[12px] text-paper">
                <span className="font-bold uppercase tracking-[0.18em] text-[10px] block mb-1">
                  // ACCEPTED
                </span>
                Login successful. Routing…
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="group w-full h-12 mt-2 bg-blood text-paper font-mono uppercase tracking-[0.22em] text-[11px] font-bold border border-blood-deep hover:bg-blood-bright disabled:bg-bg-card disabled:text-paper-faint disabled:border-border-emphasized disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              <span>{success ? "Routing" : loading ? "Verifying" : "Sign In"}</span>
              {!loading && !success && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </form>

          <HRule className="my-8" />

          <div className="space-y-3">
            <Link
              href="/register"
              className="flex items-center justify-between group font-mono uppercase tracking-[0.20em] text-[11px] text-paper hover:text-blood-bright transition-colors"
            >
              <span>Request Access · Register →</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/login/eb"
              className="flex items-center justify-between font-mono uppercase tracking-[0.20em] text-[10px] text-paper-mute hover:text-paper transition-colors"
            >
              <span>Executive Board Portal</span>
              <span className="text-paper-faint">CLEARANCE: HIGH</span>
            </Link>
            <Link
              href="/"
              className="block font-mono uppercase tracking-[0.20em] text-[10px] text-paper-faint hover:text-paper-mute transition-colors"
            >
              ← Back to Dossier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
