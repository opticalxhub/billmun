'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import type { ConferenceStatusData } from '@/lib/use-conference-gate';

function formatCountdown(targetDate: Date) {
  const now = Date.now();
  const diff = targetDate.getTime() - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export function ConferenceLockScreen({ data }: { data: ConferenceStatusData }) {
  const [countdown, setCountdown] = useState<ReturnType<typeof formatCountdown>>(null);
  const [isRechecking, setIsRechecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const nextStart = data.next_window?.start_time
    ? new Date(data.next_window.start_time)
    : null;

  useEffect(() => {
    if (!nextStart) return;
    const tick = () => setCountdown(formatCountdown(nextStart));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextStart?.getTime()]);

  const handleRecheck = async () => {
    setIsRechecking(true);
    await queryClient.invalidateQueries({ queryKey: ['conference-status'] });
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRechecking(false);
  };

  const isPostConference = data.status === 'POST_CONFERENCE';

  const statusMessage = (() => {
    switch (data.status) {
      case 'PRE_CONFERENCE':
        return 'The conference has not started yet. The portal will open when the first session begins.';
      case 'CLOSED':
        return data.manual_override === 'CLOSED'
          ? 'Portal access is temporarily closed by the Secretariat.'
          : 'The portal is currently closed. It will reopen at the next session.';
      case 'POST_CONFERENCE':
        return data.post_conference_message || 'The conference has concluded. Thank you for participating!';
      default:
        return 'Portal access is currently unavailable.';
    }
  })();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center font-inter">
      <div className="max-w-lg w-full space-y-8">
        <Link href="/" className="inline-block">
          <img
            src="/billmun.png"
            alt="BILLMUN"
            className="w-40 h-auto mx-auto dark:invert opacity-80"
          />
        </Link>

        <div className="space-y-3">
          <div className="inline-flex px-3 py-1 rounded-full bg-status-warning-bg text-status-warning-text border border-status-warning-border text-[10px] font-bold uppercase tracking-widest">
            {data.status === 'POST_CONFERENCE' ? 'Conference Ended' : 'Portal Locked'}
          </div>
          <h1 className="font-jotia text-3xl sm:text-4xl text-text-primary tracking-tight">
            {data.status === 'POST_CONFERENCE' ? 'Conference Complete' : 'Access Locked'}
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
            {statusMessage}
          </p>
        </div>

        {mounted && countdown && nextStart && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              {data.next_window?.label || 'Next Session'} starts in
            </p>
            <div className="flex items-center justify-center gap-4">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Min', value: countdown.minutes },
                { label: 'Sec', value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <span className="font-jotia text-3xl sm:text-4xl text-text-primary">
                    {item.value.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-dimmed">
              {nextStart.toLocaleString('en-US', {
                timeZone: 'Asia/Riyadh',
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              (Riyadh Time)
            </p>
          </div>
        )}

        {data.windows.length > 0 && (
          <div className="border border-border-subtle rounded-2xl p-4 bg-bg-card text-left">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Conference Schedule
            </p>
            <div className="space-y-2">
              {data.windows.map((w) => {
                const start = new Date(w.start_time);
                const end = new Date(w.end_time);
                const now = new Date();
                const isPast = now > end;
                const isCurrent = now >= start && now <= end;
                return (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isCurrent
                        ? 'border-status-approved-border bg-status-approved-bg/10'
                        : isPast
                        ? 'border-border-subtle opacity-50'
                        : 'border-border-subtle'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{w.label}</p>
                      <p className="text-[10px] text-text-dimmed mt-0.5">
                        {start.toLocaleString('en-US', {
                          timeZone: 'Asia/Riyadh',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' — '}
                        {end.toLocaleString('en-US', {
                          timeZone: 'Asia/Riyadh',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-status-approved-text uppercase tracking-widest animate-pulse">
                        Live
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                        Ended
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isPostConference && (
          <a
            href="https://instagram.com/billmun.sa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-text-primary text-bg-base rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Follow @billmun.sa
          </a>
        )}

        {!isPostConference && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRecheck}
              disabled={isRechecking}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-border-subtle rounded-button hover:bg-bg-raised transition-all disabled:opacity-50"
            >
              {isRechecking ? 'Checking...' : 'Recheck'}
            </button>
            <p className="text-[10px] text-text-dimmed">
              Auto-refreshes every minute
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
