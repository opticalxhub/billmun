"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/button';
import { Input, FormLabel, FormGroup, ErrorMessage } from '@/components/ui';

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
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-lg p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img src="/billmun.png" alt="BILLMUN Logo" className="w-32 h-auto" />
          </Link>
        </div>
        
        <h1 className="font-jotia text-2xl text-center mb-6 tracking-widest text-text-primary">PORTAL LOGIN</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <FormGroup>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
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
             />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && (
            <div className="text-center text-sm font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
              Login successful. Redirecting...
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading || success}>
            {success ? 'Redirecting...' : loading ? 'Logging in...' : 'Sign In'}
          </Button>
          
          <div className="text-center mt-6 text-sm text-text-secondary">
            Don&apos;t have an account? <Link href="/register" className="text-text-primary underline hover:text-text-dimmed">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
