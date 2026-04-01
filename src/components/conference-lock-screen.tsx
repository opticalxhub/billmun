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
  const queryClient = useQueryClient();

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

  const statusMessage = (() => {
    switch (data.status) {
      case 'PRE_CONFERENCE':
        return 'The conference has not started yet.';
      case 'CLOSED':
        return data.manual_override === 'CLOSED'
          ? 'Portal access is temporarily closed by the Secretariat.'
          : 'The portal is currently closed.';
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

        {countdown && nextStart && (
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
      </div>
    </div>
  );
}
