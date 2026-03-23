'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/footer';

export default function LandingPage() {
  const [conferenceDate, setConferenceDate] = useState<Date | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isLoadingCountdown, setIsLoadingCountdown] = useState(true);

  // Instant fallback date for immediate display
  const fallbackDate = useMemo(() => new Date('2026-03-27T09:00:00+03:00'), []);
  const displayDate = conferenceDate || fallbackDate;

  // Calculate countdown instantly with fallback date
  const calculateTimeLeft = useMemo(() => {
    const now = new Date().getTime();
    const distance = displayDate.getTime() - now;

    if (distance < 0) return null;
    
    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  }, [displayDate]);

  useEffect(() => {
    async function fetchData() {
      // Check auth state
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      // Fetch conference settings
      const { data: sData } = await supabase.from('conference_settings').select('conference_date').single();
      if (sData?.conference_date) {
        setConferenceDate(new Date(sData.conference_date));
      }
      // Stop loading countdown once data is fetched
      setIsLoadingCountdown(false);
    }
    fetchData();
  }, []);

  // Initialize countdown instantly with fallback
  useEffect(() => {
    setTimeLeft(calculateTimeLeft);
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (!conferenceDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = conferenceDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conferenceDate]);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-6 backdrop-blur-md bg-bg-base/80 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center gap-4 group">
            <span className="font-jotia text-xl sm:text-2xl tracking-widest uppercase">BILLMUN</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section — viewport-fitted */}
      <section className="relative h-[100dvh] flex items-center justify-center">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 text-center flex flex-col items-center justify-center gap-4 sm:gap-5">
          <Image 
            src="/billmun.png" 
            alt="BILLMUN Logo" 
            width={400} 
            height={400}
            className="w-auto h-auto max-h-[28vh] object-contain hover:scale-105 transition-transform duration-700 drop-shadow-2xl dark:invert"
            priority={true}
            unoptimized={true}
          />

          <div className="flex flex-col items-center gap-1">
            <p className="font-jotia text-base sm:text-lg md:text-2xl text-text-primary tracking-wide px-2">
              The official digital portal for the BILLMUN 2026 conference
            </p>
            <div className="flex items-center gap-3 sm:gap-6 mt-1">
              <span className="font-jotia text-xs sm:text-sm text-text-secondary uppercase tracking-[0.2em]">
                27-28th March
              </span>
              <span className="w-1 h-1 rounded-full bg-border-strong" />
              <span className="font-jotia text-xs sm:text-sm text-text-secondary uppercase tracking-[0.1em]">
                Rowad Al Khaleej
              </span>
            </div>
            <p className="font-jotia text-xs sm:text-sm text-text-tertiary uppercase tracking-[0.1em] mt-1">
              Made by Kenan Nezar & Alaa Abbadi
            </p>
          </div>

          {(timeLeft || isLoadingCountdown) && (
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {isLoadingCountdown ? (
                <Loader2 className="w-8 h-8 animate-spin text-text-primary" />
              ) : (
                [
                  { label: 'Days', value: timeLeft!.days },
                  { label: 'Hours', value: timeLeft!.hours },
                  { label: 'Min', value: timeLeft!.minutes },
                  { label: 'Sec', value: timeLeft!.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="font-jotia text-3xl sm:text-4xl md:text-5xl font-light text-text-primary mb-0.5">
                      {item.value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                      {item.label}
                    </span>
                  </div>))
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full px-4 sm:px-0 mt-1">
            <Link 
              href={isLoggedIn ? '/dashboard' : '/login'} 
              className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-text-primary text-bg-base rounded-full font-bold text-base sm:text-lg hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? 'Open Portal' : 'Sign In'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!isLoggedIn && (
              <Link 
                href="/register" 
                className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 border border-border-emphasized text-text-secondary rounded-full font-semibold text-base sm:text-lg hover:border-border-strong hover:text-text-primary transition-colors"
              >
                Register
              </Link>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}