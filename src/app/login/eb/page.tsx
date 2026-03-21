'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input, FormLabel, FormGroup, ErrorMessage } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function EBLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        setError('Login failed');
        setLoading(false);
        return;
      }

      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('status, role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        setError('Failed to load profile');
        setLoading(false);
        return;
      }

      const role = userProfile?.role?.toUpperCase();

      // Redirect based on role
      if (role === 'EXECUTIVE_BOARD' || role === 'ADMIN' || role === 'SECRETARY_GENERAL' || role === 'DEPUTY_SECRETARY_GENERAL') {
        router.push('/eb/dash');
      } else {
        setError(`Access denied. This portal is for Executive Board members only. Current role: ${userProfile?.role}`);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex font-inter selection:bg-white-pure selection:text-bg-base">
      {/* Left Form Side */}
      <div className="w-full max-w-[480px] p-10 flex flex-col justify-center bg-bg-base relative z-10 border-r border-border-subtle shadow-2xl">
        <div className="w-full max-w-sm mx-auto">
          {/* Brand Logo */}
          <div className="mb-16">
            <Link href="/" className="inline-block hover:scale-105 transition-transform duration-300">
              <Image src="/billmun.png" alt="BILLMUN Logo" width={80} height={80} className="w-20 h-auto" />
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="font-jotia text-5xl text-text-primary mb-3 tracking-tight">
              Executive Portal
            </h1>
            <p className="text-text-secondary text-lg">
              Sign in to manage committees and users.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGroup>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                placeholder="••••••••"
                required
              />
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Button type="submit" variant="default" disabled={loading} className="w-full py-3">
              Sign In
            </Button>
          </form>

          {/* Register & EB Links */}
          <div className="mt-8 pt-8 border-t border-border-subtle flex flex-col gap-4 text-left">
            <p className="text-sm text-text-dimmed">
              Not an EB member?{' '}
              <Link href="/login" className="font-semibold text-text-primary hover:text-text-secondary transition-colors underline underline-offset-4">
                Attendee Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Background Side */}
      <div className="hidden lg:flex flex-1 bg-bg-card relative overflow-hidden items-center justify-center">
        {/* Chevron Pattern Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chevrons" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(4)">
                <path d="M0 50 L50 100 L100 50 L100 25 L50 75 L0 25 Z" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chevrons)" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-lg text-center px-8">
          <Image src="/billmun.png" alt="BILLMUN Logo Large" width={300} height={300} className="mx-auto mb-12 opacity-80" />
          <h2 className="font-jotia text-4xl mb-4 text-text-primary">Executive Control</h2>
          <p className="text-text-secondary text-lg leading-relaxed">Secure your session to manage committees, review documents, and direct the flow of debate.</p>
        </div>
      </div>
    </div>
  );
}