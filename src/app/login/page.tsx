"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/button';
import { Input, FormLabel, FormGroup, ErrorMessage } from '@/components/ui';

import { BackgroundPaths } from '@/components/ui/background-paths';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      // Auth cookies are set by the API response automatically.
      // Also set session client-side for supabase JS client usage.
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setSuccess(true);
      // Full page navigation — middleware will now see auth cookies
      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths title="Portal Login" />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Link href="/">
              <img src="/billmun.png" alt="BILLMUN Logo" className="w-24 sm:w-32 h-auto dark:invert" />
            </Link>
          </div>
          
          <h1 className="font-jotia text-xl sm:text-2xl text-center mb-6 tracking-widest text-text-primary">PORTAL LOGIN</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <FormGroup>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-white/5 border-white/10 focus:border-white/30"
              />
            </FormGroup>
            
            <FormGroup>
               <FormLabel htmlFor="password">Password</FormLabel>
               <Input 
                 id="password" 
                 type="password" 
                 value={password} 
                 onChange={(e) => setPassword(e.target.value)} 
                 required 
                 className="bg-white/5 border-white/10 focus:border-white/30"
               />
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && (
              <div className="text-center text-sm font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                Login successful. Redirecting...
              </div>
            )}

            <Button type="submit" className="w-full mt-4 bg-primary hover:bg-primary/90 text-white" disabled={loading || success}>
              {success ? 'Redirecting...' : loading ? 'Logging in...' : 'Sign In'}
            </Button>
            
            <div className="text-center mt-6 text-sm text-text-secondary">
              Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
