'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Notepad } from './notepad';
import { NotificationBell } from './notification-bell';
import { ReportIssueModal } from './report-issue-modal';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'live-monitor', label: 'Live Monitor' },
  { id: 'committees', label: 'Committees' },
  { id: 'documents', label: 'Documents' },
  { id: 'security', label: 'Security' },
  { id: 'communications', label: 'Communications' },
  { id: 'settings', label: 'Settings' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'internal-workspace', label: 'Internal Workspace' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'reports', label: 'Reports Panel' },
  { id: 'schedule', label: 'Conference Schedule' },
];

export const EBLayout = ({ children, activeTab, onTabChange }: { children: React.ReactNode, activeTab: string, onTabChange: (id: string) => void }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Emergency Override Check
    if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
      setUser({
        id: 'emergency-actor',
        email: 'emergency@billmun.com',
        full_name: 'Engineer (Emergency)',
        role: 'EXECUTIVE_BOARD',
        status: 'APPROVED',
        has_completed_onboarding: true
      });
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('users').select('*').eq('id', data.user.id).single().then(({ data: userData }) => {
          setUser(userData);
        });
      }
    });
  }, []);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen font-inter bg-bg-base dark">
      {/* Top navbar */}
      <nav className="h-14 sm:h-16 lg:h-20 border-b border-border-subtle bg-bg-card flex items-center px-3 sm:px-4 md:px-8 justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <img src="/billmun.png" alt="BILLMUN Logo" className="w-16 sm:w-20 lg:w-24 h-auto dark:invert shrink-0" />
          <span className="font-jotia-bold text-sm sm:text-lg md:text-xl text-text-primary tracking-[0.1em] sm:tracking-[0.15em] uppercase truncate">Executive Board</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {user && <ReportIssueModal user={user} />}
            {user && <NotificationBell userId={user.id} />}
          </div>
          <div className="hidden sm:block h-6 w-px bg-border-subtle mx-1" />
          <div className="hidden sm:flex items-center gap-3 lg:gap-4">
            <Link href="/" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-dimmed hover:text-text-primary transition-all">Exit</Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 lg:px-4 h-9 lg:h-10 text-[10px] font-bold uppercase tracking-widest text-status-rejected-text bg-status-rejected-bg/10 border border-status-rejected-border/20 rounded-button hover:bg-status-rejected-bg/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Log Out</span>
            </button>
          </div>
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-text-dimmed hover:text-text-primary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-bg-card border-l border-border-subtle overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-text-dimmed">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-text-dimmed hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-[11px] uppercase tracking-widest rounded-input transition-all ${
                    activeTab === item.id 
                      ? 'bg-bg-raised text-text-primary border border-border-subtle' 
                      : 'hover:bg-bg-raised/50 text-text-dimmed hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-border-subtle space-y-2 sm:hidden">
              <Link href="/" className="block text-center text-[10px] font-black uppercase tracking-widest text-text-dimmed hover:text-text-primary py-2">Exit</Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 h-9 text-[10px] font-bold uppercase tracking-widest text-status-rejected-text bg-status-rejected-bg/10 border border-status-rejected-border/20 rounded-button hover:bg-status-rejected-bg/20 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tablet horizontal scrollable tabs (md to lg) */}
      <div className="hidden md:block lg:hidden border-b border-border-subtle bg-bg-card">
        <nav className="px-3 py-2 flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`h-9 px-3 text-[10px] uppercase tracking-widest border rounded-input inline-flex items-center transition-all ${
                activeTab === item.id 
                  ? 'bg-bg-raised border-border-emphasized text-text-primary' 
                  : 'border-border-subtle hover:border-border-emphasized text-text-dimmed'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="w-[240px] border-r border-border-subtle bg-bg-card hidden lg:block overflow-y-auto shrink-0">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2 text-[11px] uppercase tracking-widest rounded-input transition-all ${
                  activeTab === item.id 
                    ? 'bg-bg-raised text-text-primary border border-border-subtle' 
                    : 'hover:bg-bg-raised/50 text-text-dimmed hover:text-text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-bg-base">
          <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            <div className="xl:col-span-8">
              {children}
            </div>
            <div className="xl:col-span-4">
              {user && <Notepad dashboardKey="EB" userId={user.id} />}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom scrollable tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-subtle md:hidden z-40">
        <nav className="px-2 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              ref={activeTab === item.id ? activeTabRef : undefined}
              onClick={() => onTabChange(item.id)}
              className={`shrink-0 h-9 px-3 text-[9px] uppercase tracking-widest border rounded-input inline-flex items-center justify-center transition-all whitespace-nowrap ${
                activeTab === item.id 
                  ? 'bg-bg-raised border-border-emphasized text-text-primary' 
                  : 'border-border-subtle text-text-dimmed'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Spacer for mobile bottom bar */}
      <div className="h-[52px] md:hidden shrink-0" />
    </div>
  );
};
