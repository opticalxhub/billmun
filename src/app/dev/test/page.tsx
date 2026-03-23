"use client";

import { useEffect, useState } from "react";
import { verifyDevTestPassphrase } from "./action";
import { supabase } from "@/lib/supabase";

type TestResultRow = {
  name: string;
  category: string;
  status: "PASSED" | "FAILED";
  error?: string;
  duration: number;
};

export default function DevTestPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkUnlock = () => {
      const flag = localStorage.getItem('dev_test_unlocked');
      const timestamp = localStorage.getItem('dev_test_timestamp');
      if (flag === 'true' && timestamp) {
        const ts = parseInt(timestamp);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) {
          setUnlocked(true);
          return;
        }
      }
      
      if (document.cookie.includes('dev_test_unlocked=true')) {
        setUnlocked(true);
        localStorage.setItem('dev_test_unlocked', 'true');
        localStorage.setItem('dev_test_timestamp', Date.now().toString());
      }
    };
    checkUnlock();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await verifyDevTestPassphrase(passphrase);
      if (res?.error) {
        setError(res.error);
      } else {
        localStorage.setItem('dev_test_unlocked', 'true');
        localStorage.setItem('dev_test_timestamp', Date.now().toString());
        setUnlocked(true);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const runTests = async (categoryName?: string) => {
    setLoading(true);
    const testCategories = [
      { name: 'INFRASTRUCTURE', tests: [
        { name: 'Server health (API)', fn: async () => {
          const res = await fetch("/api/dev/health", { credentials: "include", cache: "no-store" });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            ok?: boolean;
            checks?: { name: string; ok: boolean; optional?: boolean; detail?: string }[];
          };
          if (res.status === 401) {
            throw new Error(data.error || "Call Run Full Audit after unlock (cookie required for server checks)");
          }
          if (!res.ok) {
            const failed = (data.checks || []).filter((c) => !c.ok && !c.optional);
            const msg = failed.map((c) => c.name + (c.detail ? `: ${c.detail}` : "")).join("; ") || data.error || `HTTP ${res.status}`;
            throw new Error(msg);
          }
          if (data.ok === false) throw new Error("Server reported ok: false");
          return true;
        }},
        { name: 'Supabase Connection', fn: async () => {
          const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
          if (error) throw error;
          return true;
        }},
        { name: 'Auth Session Check', fn: async () => {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
          return true;
        }},
        { name: 'Environment Variables', fn: async () => {
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing');
          if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
          return true;
        }},
        { name: 'Notification Fetching', fn: async () => {
          const { error } = await supabase.from('notifications').select('id').limit(1);
          if (error && error.code !== 'PGRST116') throw error;
          return true;
        }},
        { name: 'Realtime Service Status', fn: async () => {
          return new Promise((resolve, reject) => {
            const channel = supabase.channel('health-check');
            const timeout = setTimeout(() => {
              supabase.removeChannel(channel);
              reject(new Error('Realtime timeout'));
            }, 5000);
            channel.subscribe(status => {
              if (status === 'SUBSCRIBED') {
                clearTimeout(timeout);
                supabase.removeChannel(channel);
                resolve(true);
              }
            });
          });
        }}
      ]},
      { name: 'AUTH & SECURITY', tests: [
        { name: 'Registration API', fn: async () => {
          const email = `test-${Date.now()}@billmun.sa`;
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password: 'Password123!',
              full_name: 'Test User',
              department: 'DELEGATE',
              preferred_committee: 'ECOSOC',
              allocated_country: 'USA',
              date_of_birth: '2000-01-01',
              grade: '12',
              phone_number: '+10000000000',
              emergency_contact_name: 'Contact',
              emergency_contact_relation: 'Parent',
              emergency_contact_phone: '+10000000001',
            }),
          });
          const data = await res.json() as { error?: string };
          if (!res.ok) {
            if (res.status === 400 && (data.error?.includes('already') || data.error?.includes('closed'))) return true;
            throw new Error(`Status ${res.status}: ${data.error || 'unknown'}`);
          }
          return true;
        }},
        { name: 'EB Registrations GET (auth)', fn: async () => {
          const res = await fetch("/api/eb/registrations", { cache: "no-store" });
          if (res.status !== 401 && res.status !== 403) {
            throw new Error(`Expected 401/403 without EB session, got ${res.status}`);
          }
          return true;
        }},
        { name: 'Users me API', fn: async () => {
          const res = await fetch("/api/users/me", { cache: "no-store" });
          if (res.status !== 401 && res.status !== 200) {
            throw new Error(`Unexpected status ${res.status}`);
          }
          return true;
        }},
        { name: 'EB Security Role Check', fn: async () => {
          const { error } = await supabase.from('users').select('id').eq('role', 'SECURITY').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'Protected Route (401)', fn: async () => {
          const res = await fetch('/api/eb/registrations/action', { method: 'POST', cache: 'no-store' });
          if (res.status !== 401 && res.status !== 307 && res.status !== 403 && res.status !== 400) throw new Error(`Status ${res.status}`);
          return true;
        }},
        { name: 'Emergency Access (911)', fn: async () => {
          const res = await fetch('/911', { cache: 'no-store' });
          if (res.status === 404) return true;
          if (res.status !== 200) throw new Error(`Status ${res.status}`);
          return true;
        }}
      ]},
      { name: 'CHAIR & EB OPS', tests: [
        { name: 'Admin Tasks API', fn: async () => {
          const res = await fetch('/api/chair/admin-tasks');
          if (res.status === 500) throw new Error('Status 500');
          return true;
        }},
        { name: 'Committee Sessions', fn: async () => {
          const { error } = await supabase.from('committee_sessions').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'Chair AI Runs History', fn: async () => {
          const { error } = await supabase.from('chair_ai_runs').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'EB Registrations Action API', fn: async () => {
          const res = await fetch('/api/eb/registrations/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'noop', user_id: '00000000-0000-0000-0000-000000000000' }),
          });
          if (res.status === 500) throw new Error('Internal Server Error');
          if (res.status !== 400 && res.status !== 401 && res.status !== 403 && res.status !== 404) {
            throw new Error(`Unexpected status ${res.status}`);
          }
          return true;
        }},
        { name: 'Session Events (Realtime)', fn: async () => {
          const { error } = await supabase.from('session_events').select('id').limit(1);
          if (error) throw error;
          return true;
        }}
      ]},
      { name: 'DELEGATE TOOLS', tests: [
        { name: 'Strategy Board Access', fn: async () => {
          const { error } = await supabase.from('strategy_board').select('id').limit(1);
          if (error && error.code !== 'PGRST116') throw error;
          return true;
        }},
        { name: 'Document List', fn: async () => {
          const { error } = await supabase.from('documents').select('id, title').limit(1);
          if (error && error.code !== 'PGRST116') throw error;
          return true;
        }},
        { name: 'Resolution Builder Access', fn: async () => {
          const { error } = await supabase.from('resolutions').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'AI Debate API Check', fn: async () => {
          const res = await fetch('/api/chair/ai-debate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Test' }),
          });
          if (res.status === 500) throw new Error('Status 500');
          if (res.status !== 401 && res.status !== 403 && res.status !== 200) {
            throw new Error(`Unexpected status ${res.status}`);
          }
          return true;
        }},
        { name: 'Documents post-upload (auth)', fn: async () => {
          const res = await fetch("/api/documents/post-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (res.status === 500) throw new Error("Status 500");
          return true;
        }},
        { name: 'Messages channels API', fn: async () => {
          const res = await fetch("/api/messages/channels", { cache: "no-store" });
          if (res.status === 500) throw new Error("Status 500");
          return true;
        }}
      ]},
      { name: 'MEDIA & PRESS', tests: [
        { name: 'Media Gallery Table', fn: async () => {
          const { error } = await supabase.from('media_gallery').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'Press Releases Access', fn: async () => {
          const { error } = await supabase.from('press_releases').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'Media Upload API Check', fn: async () => {
          const res = await fetch('/api/media/upload', { method: 'POST' });
          if (res.status === 500) throw new Error('Status 500');
          if (res.status !== 401 && res.status !== 403 && res.status !== 400) {
            throw new Error(`Unexpected status ${res.status}`);
          }
          return true;
        }}
      ]},
      { name: 'CONFERENCE DAY READY', tests: [
        { name: 'Conference Settings Check', fn: async () => {
          const { error } = await supabase.from('conference_settings').select('*').limit(1).single();
          if (error) throw error;
          return true;
        }},
        { name: 'Committees Population', fn: async () => {
          const { count, error } = await supabase.from('committees').select('*', { count: 'exact', head: true });
          if (error) throw error;
          if ((count || 0) === 0) throw new Error('No committees found');
          return true;
        }},
        { name: 'Global Messaging (Realtime)', fn: async () => {
          const { error } = await supabase.from('messages').select('id').limit(1);
          if (error) throw error;
          return true;
        }},
        { name: 'Logo & Assets Check', fn: async () => {
          const res = await fetch('/billmun.png');
          if (res.status !== 200) throw new Error('Main logo missing');
          return true;
        }}
      ]}
    ];

    const activeCategories = categoryName 
      ? testCategories.filter(c => c.name === categoryName)
      : testCategories;

    const allTests = activeCategories.flatMap(c => c.tests.map(t => ({ ...t, category: c.name })));
    setResults([]);
    setProgress(0);

    let completed = 0;
    for (const test of allTests) {
      const startTime = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - startTime;
        setResults(prev => [...prev, { name: test.name, category: test.category, status: 'PASSED', duration }]);
      } catch (err: unknown) {
        const duration = Date.now() - startTime;
        const msg = err instanceof Error ? err.message : String(err);
        setResults(prev => [...prev, { name: test.name, category: test.category, status: 'FAILED', error: msg, duration }]);
      }
      completed++;
      setProgress(Math.round((completed / allTests.length) * 100));
    }
    setLoading(false);
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-bg-card p-8 rounded-card border border-border-subtle">
          <div className="flex justify-center mb-6">
            <img src="/billmun.png" alt="Logo" className="w-20 h-auto invert" />
          </div>
          <h1 className="font-jotia-bold text-2xl text-text-primary mb-2">Dev Diagnostics</h1>
          <p className="text-text-dimmed text-sm mb-6">Enter passphrase to access system health tools.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full h-12 bg-bg-raised border border-border-input rounded-input px-4 text-text-primary focus:border-text-primary outline-none transition-all"
              placeholder="Passphrase"
              required
            />
            {error && <p className="text-status-rejected-text text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-text-primary text-bg-base rounded-button font-bold uppercase tracking-widest hover:bg-text-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-bg-base p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-jotia-bold text-4xl text-text-primary uppercase tracking-tight">System Health</h1>
            <p className="text-text-dimmed mt-2">Comprehensive conference-day readiness diagnostics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => runTests()}
              disabled={loading}
              className="px-6 h-12 bg-text-primary text-bg-base rounded-button font-bold uppercase tracking-widest hover:bg-text-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? `Running (${progress}%)` : "Run Full Audit"}
            </button>
            <button
              onClick={() => { localStorage.removeItem('dev_test_unlocked'); setUnlocked(false); }}
              className="px-6 h-12 border border-border-subtle text-text-secondary rounded-button font-bold uppercase tracking-widest hover:bg-bg-raised transition-all"
            >
              Lock
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-bg-card p-6 rounded-card border border-border-subtle">
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Passed</p>
              <p className="text-3xl font-bold text-status-approved-text">{passed}</p>
            </div>
            <div className="bg-bg-card p-6 rounded-card border border-border-subtle">
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Failed</p>
              <p className="text-3xl font-bold text-status-rejected-text">{failed}</p>
            </div>
            <div className="bg-bg-card p-6 rounded-card border border-border-subtle">
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Efficiency</p>
              <p className="text-3xl font-bold text-text-primary">{Math.round((passed / results.length) * 100)}%</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {['INFRASTRUCTURE', 'AUTH & SECURITY', 'CHAIR & EB OPS', 'DELEGATE TOOLS', 'MEDIA & PRESS', 'CONFERENCE DAY READY'].map(cat => {
            const catResults = results.filter(r => r.category === cat);
            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-jotia-bold text-lg text-text-secondary uppercase tracking-widest">{cat}</h2>
                  {!loading && results.length === 0 && (
                    <button onClick={() => runTests(cat)} className="text-[10px] font-bold text-text-tertiary hover:text-text-primary uppercase tracking-widest">Run Only</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catResults.map((res, i) => (
                    <div key={i} className={`p-4 rounded-card border flex items-start justify-between transition-all ${
                      res.status === 'PASSED' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{res.name}</p>
                        {res.error && <p className="text-xs text-status-rejected-text mt-1 font-mono">{res.error}</p>}
                        <p className="text-[10px] text-text-tertiary mt-2 uppercase font-mono">{res.duration}ms</p>
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                        res.status === 'PASSED' ? 'bg-status-approved-bg text-status-approved-text' : 'bg-status-rejected-bg text-status-rejected-text'
                      }`}>
                        {res.status}
                      </div>
                    </div>
                  ))}
                  {catResults.length === 0 && !loading && (
                    <div className="col-span-2 py-8 border border-dashed border-border-subtle rounded-card flex items-center justify-center text-text-dimmed text-sm">
                      No results for this category.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
