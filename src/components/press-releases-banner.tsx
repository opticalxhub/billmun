"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function PressReleasesBanner() {
  const [releases, setReleases] = useState<{ title: string; body: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchReleases() {
      let { data, error } = await supabase
        .from("press_releases")
        .select("title, body")
        .eq("status", "PUBLISHED")
        .eq("is_hidden", false)
        .limit(10);

      if (error) {
        const res = await supabase
          .from("press_releases")
          .select("title, body")
          .eq("status", "PUBLISHED")
          .limit(10);
        data = res.data;
      }
      const unique = (data || []).filter(
        (r, i, arr) => arr.findIndex((x) => x.title === r.title) === i
      );
      setReleases(unique);
    }
    fetchReleases();
    const interval = setInterval(fetchReleases, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || releases.length === 0) return null;

  const items = releases.map(
    (r) => `${r.title} — ${r.body.substring(0, 120)}${r.body.length > 120 ? "..." : ""}`
  );

  return (
    <div
      id="pr-banner"
      className="fixed top-[64px] left-0 right-0 z-40 w-full bg-bg-base border-b border-border-subtle py-2 overflow-hidden"
    >
      <div className="flex items-center">
        <span className="flex items-center gap-2 px-4 border-r border-border-subtle shrink-0 h-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blood-bright animate-pulse" aria-hidden />
          <span className="font-mono uppercase tracking-[0.22em] text-[10px] font-bold text-blood-bright">
            WIRE
          </span>
        </span>

        <div className="flex animate-marquee whitespace-nowrap items-center flex-1">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center">
              {items.map((text, idx) => (
                <span key={`${copy}-${idx}`} className="flex items-center">
                  {idx > 0 && (
                    <span className="mx-6 font-mono text-paper-faint text-[10px] select-none">
                      ///
                    </span>
                  )}
                  <span className="font-mono text-[12px] tracking-[0.04em] text-paper-soft">
                    {text}
                  </span>
                </span>
              ))}
              <span className="mx-6 font-mono text-paper-faint text-[10px] select-none">///</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
