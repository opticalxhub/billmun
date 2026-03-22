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
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 backdrop-blur-md bg-bg-base/80 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center gap-4 group">
            <span className="font-jotia text-2xl tracking-widest uppercase">BILLMUN<sup className="text-lg"></sup></span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-8 mt-16">
              <Image 
                src="/billmun.png" 
                alt="BILLMUN Logo" 
                width={360} 
                height={360}
                priority={true}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
              />
            </div>
            <div className="flex flex-col items-center gap-2 mb-12">
              <p className="font-jotia text-m md:text-2xl text-text-primary tracking-wide">
                The official digital portal for the BILLMUN 2026 conference
              </p>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 mt-4">
                <span className="font-jotia text-m text-text-secondary uppercase tracking-[0.2em]">
                  27-28th March
                </span>
                <span className="hidden md:block w-1 h-1 rounded-full bg-border-strong" />
                <span className="font-jotia text-m text-text-secondary uppercase tracking-[0.1em]">
                  Rowad Al Khaleej
                </span>
              </div>
              <p className="font-jotia text-m text-text-tertiary uppercase tracking-[0.1em] mt-2">
                Made by Kenan Nezar & Alaa Abbadi
              </p>
            </div>

            {(timeLeft || isLoadingCountdown) && (
              <div className="flex items-center justify-center gap-6 mb-16">
                {isLoadingCountdown ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-text-primary" />
                  </div>
                ) : (
                  [
                    { label: 'Days', value: timeLeft!.days },
                    { label: 'Hours', value: timeLeft!.hours },
                    { label: 'Min', value: timeLeft!.minutes },
                    { label: 'Sec', value: timeLeft!.seconds },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="font-jotia text-4xl md:text-5xl font-light text-text-primary mb-1">
                        {item.value.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>  ))
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-8">
              <Link 
                href={isLoggedIn ? '/dashboard' : '/login'} 
                className="group flex items-center gap-3 px-12 py-5 bg-text-primary text-bg-base rounded-full font-bold text-lg hover:opacity-90 transition-opacity"
              >
              {isLoggedIn ? 'Open Portal' : 'Sign In'}                
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {!isLoggedIn && (
                <Link 
                  href="/register" 
                  className="group flex items-center gap-2 px-10 py-5 border border-border-emphasized text-text-secondary rounded-full font-semibold text-lg hover:border-border-strong hover:text-text-primary transition-colors"
                >
                  Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="mt-32"></div>
      <Footer />
    </div>
  );
}