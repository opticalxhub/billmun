"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const BackgroundPaths = dynamic(
  () =>
    import('@/components/ui/background-paths').then((m) => ({
      default: m.BackgroundPaths,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-neutral-950" aria-hidden />
    ),
  },
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
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
              ? 'Login response was invalid. Try again or hard-refresh the page.'
              : 'Login failed (server error). Clear .next and restart the dev server if this persists.',
          );
          setLoading(false);
          return;
        }
      }

      if (!res.ok) {
        setError(data.error || 'Login failed.');
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
      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link href="/">
                <img
                  src="/billmun.png"
                  alt="BILLMUN Logo"
                  className="w-20 sm:w-24 h-auto invert opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
                />
              </Link>
            </div>

            {/* Title */}
            <h1 className="font-jotia text-xl sm:text-2xl text-center mb-8 tracking-[0.25em] text-white/90">
              PORTAL LOGIN
            </h1>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
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
                  className="w-full h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="text-center text-sm font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-center text-sm font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                  Login successful. Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-11 mt-2 rounded-lg bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {success ? 'Redirecting...' : loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-4">
              <div>
                <Link href="/register" className="text-sm font-bold uppercase tracking-[0.1em] text-white/90 hover:text-white hover:underline transition-all">
                  Register for an account
                </Link>
              </div>
              <div>
                <Link href="/" className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
