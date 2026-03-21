'use client';

import React from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/eb/dash/overview', label: 'Overview' },
  { href: '/eb/dash/registrations', label: 'Registrations' },
  { href: '/eb/dash/live-monitor', label: 'Live Monitor' },
  { href: '/eb/dash/committees', label: 'Committees' },
  { href: '/eb/dash/documents', label: 'Documents' },
  { href: '/eb/dash/security', label: 'Security' },
  { href: '/eb/dash/communications', label: 'Communications' },
  { href: '/eb/dash/settings', label: 'Settings' },
  { href: '/eb/dash/audit', label: 'Audit Log' },
  { href: '/eb/dash/internal-workspace', label: 'Internal Workspace' },
];

export const EBLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen font-inter bg-bg-base dark pb-14 md:pb-0">
      <nav className="h-20 border-b border-border-subtle bg-bg-card flex items-center px-4 md:px-8 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <img src="/billmun.png" alt="BILLMUN Logo" className="w-24 h-auto dark:invert-0 invert" />
          <span className="font-jotia-bold text-lg md:text-xl text-text-primary tracking-[0.15em] uppercase">Executive Board</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-dimmed hover:text-text-primary transition-all">Exit</Link>
        </div>
      </nav>

      <div className="hidden md:block lg:hidden border-b border-border-subtle bg-bg-card">
        <nav className="px-3 py-2 flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="h-9 px-3 text-[10px] uppercase tracking-widest border border-border-subtle rounded-input inline-flex items-center hover:border-border-emphasized">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] border-r border-border-subtle bg-bg-card hidden lg:block overflow-y-auto">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="block px-3 py-2 text-[11px] uppercase tracking-widest rounded-input hover:bg-bg-raised text-text-primary">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-bg-card border-t border-border-subtle md:hidden">
        <nav className="h-full px-2 flex items-center justify-between gap-1">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="flex-1 h-10 text-[9px] uppercase tracking-widest border border-border-subtle rounded-input inline-flex items-center justify-center">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};