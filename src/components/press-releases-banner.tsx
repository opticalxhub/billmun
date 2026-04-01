'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function PressReleasesBanner() {
  const [releases, setReleases] = useState<{ title: string; body: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchReleases() {
      // Try with is_hidden first, fall back without it
      let { data, error } = await supabase
        .from('press_releases')
        .select('title, body')
        .eq('status', 'PUBLISHED')
        .eq('is_hidden', false)
        .limit(10);

      if (error) {
        // Fallback: column might not exist yet
        const res = await supabase
          .from('press_releases')
          .select('title, body')
          .eq('status', 'PUBLISHED')
          .limit(10);
        data = res.data;
      }
      // Deduplicate by title
      const unique = (data || []).filter((r, i, arr) => arr.findIndex(x => x.title === r.title) === i);
      setReleases(unique);
    }
    fetchReleases();
    const interval = setInterval(fetchReleases, 30000);
    return () => clearInterval(interval);
  }, []);

  // Return null on server AND initial client render — both match = no hydration error
  // Banner appears only after client mount + data fetch
  if (!mounted || releases.length === 0) {
    return null;
  }

  const items = releases.map(r => `${r.title} — ${r.body.substring(0, 120)}${r.body.length > 120 ? '...' : ''}`);

  return (
    <div
      id="pr-banner"
      className="fixed top-[65px] left-0 right-0 z-40 w-full bg-[#0a0a0a] border-b border-white/10 text-white py-3 overflow-hidden font-jotia"
    >
      <div className="flex animate-marquee whitespace-nowrap items-center justify-center">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex items-center">
            {items.map((text, idx) => (
              <span key={`${copy}-${idx}`} className="flex items-center">
                {idx > 0 && (
                  <span className="mx-4 text-white/30 text-sm select-none">|</span>
                )}
                <span className="text-[13px] tracking-wide font-medium">{text}</span>
              </span>
            ))}
            <span className="mx-4 text-white/30 text-sm select-none">|</span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
