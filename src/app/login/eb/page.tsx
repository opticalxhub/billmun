"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  NxtmunMark,
  MonoLabel,
  StampBadge,
  HRule,
  NoiseOverlay,
} from "@/components/nxtmun/primitives";

export default function EBLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed");
        setLoading(false);
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("status, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        setError("Failed to load profile");
        setLoading(false);
        return;
      }

      const role = userProfile?.role?.toUpperCase();

      if (
        role === "EXECUTIVE_BOARD" ||
        role === "ADMIN" ||
        role === "SECRETARY_GENERAL" ||
        role === "DEPUTY_SECRETARY_GENERAL"
      ) {
        router.push("/eb/dash");
      } else {
        setError(
          `Access denied. This portal is for Executive Board members only. Current role: ${userProfile?.role}`
        );
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-base text-paper grid lg:grid-cols-2">
      <NoiseOverlay intensity="heavy" />

      {/* Left — auth form */}
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1 border-r border-border-subtle">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 flex items-center justify-between">
            <NxtmunMark size="md" />
            <StampBadge variant="blood">RESTRICTED</StampBadge>
          </div>

          <div className="mb-8">
            <MonoLabel tone="blood" className="mb-3 block">// EXECUTIVE PORTAL</MonoLabel>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05]">
              Restricted <span className="italic">access</span>.
            </h1>
            <p className="font-mono text-[12px] text-paper-mute mt-3">
              EB, Secretariat, and Administrators only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="eb-email"
                className="block font-mono uppercase tracking-[0.20em] text-[10px] text-paper-mute mb-2"
              >
                // Email
              </label>
              <input
                id="eb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="officer@nxtmun.com"
                className="w-full h-12 bg-bg-card border border-border-emphasized px-4 font-mono text-[13px] text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="eb-password"
                className="block font-mono uppercase tracking-[0.20em] text-[10px] text-paper-mute mb-2"
              >
                // Password
              </label>
              <input
                id="eb-password"
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
                  // ACCESS DENIED
                </span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full h-12 bg-blood text-paper font-mono uppercase tracking-[0.22em] text-[11px] font-bold border border-blood-deep hover:bg-blood-bright disabled:bg-bg-card disabled:text-paper-faint disabled:border-border-emphasized disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              <span>{loading ? "Verifying" : "Authorize"}</span>
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </form>

          <HRule className="my-8" />

          <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.18em]">
            <p className="text-paper-mute">Not an officer?</p>
            <Link href="/login" className="text-paper hover:text-blood-bright transition-colors block">
              → Standard Portal
            </Link>
            <Link
              href="/"
              className="text-paper-faint hover:text-paper-mute transition-colors block"
            >
              ← Back to Dossier
            </Link>
          </div>
        </div>
      </div>

      {/* Right — file index */}
      <aside className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-bg-card/30 order-1 lg:order-2">
        <div className="absolute inset-0 nxt-scanlines pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, var(--nxt-blood) 0, transparent 40%), radial-gradient(circle at 20% 80%, var(--nxt-paper) 0, transparent 40%)",
          }}
        />

        <div className="relative">
          <NxtmunMark size="lg" withTagline />
        </div>

        <div className="relative max-w-md">
          <MonoLabel tone="blood" className="mb-3 block">// CLEARANCE: HIGH</MonoLabel>
          <h2 className="font-display text-4xl leading-[1.05]">
            Direct the <span className="italic">flow of debate</span>.
          </h2>
          <p className="font-mono text-[13px] text-paper-soft mt-4 leading-relaxed">
            Manage committees, review documents, oversee delegates, and coordinate the
            secretariat from a single command surface.
          </p>
        </div>

        <div className="relative flex items-center justify-between">
          <MonoLabel>FILE-NXT-2026 / EB-001</MonoLabel>
          <StampBadge variant="blood">RESTRICTED</StampBadge>
        </div>
      </aside>
    </div>
  );
}
