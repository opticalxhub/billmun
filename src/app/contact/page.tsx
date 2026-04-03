'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/footer';
import { PublicNavbar } from '@/components/public-navbar';
import { FadeIn, ScrollReveal, ScaleIn } from '@/components/gsap-animations';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-inter flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-3xl mx-auto px-6 md:px-10 pt-32 pb-24 w-full">
        <FadeIn delay={0.1} from="left">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </FadeIn>

        <FadeIn delay={0.2} from="bottom">
          <h1 className="font-jotia text-5xl md:text-6xl mb-3">Contact Us</h1>
        </FadeIn>
        <FadeIn delay={0.35} from="bottom">
          <div className="space-y-3 mb-10">
            <p className="text-text-secondary max-w-lg">
              Have a question about BILLMUN? Reach out to our team.
            </p>
            <a
              href="mailto:pr@billmun.com"
              className="text-text-primary font-bold text-lg hover:underline inline-block"
            >
              pr@billmun.com
            </a>
          </div>
        </FadeIn>

        {success ? (
          <ScaleIn delay={0.1} from={0.9}>
          <div className="mt-8 p-8 border-2 border-status-approved-border rounded-2xl bg-status-approved-bg/10 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-status-approved-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="font-jotia text-2xl mb-2">Message Sent</h2>
            <p className="text-text-secondary text-sm">We&apos;ll get back to you as soon as possible.</p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 px-6 py-2 text-xs font-bold uppercase tracking-widest border border-border-subtle rounded-full hover:bg-bg-raised transition-colors"
            >
              Send Another
            </button>
          </div>
          </ScaleIn>
        ) : (
          <ScrollReveal delay={0.4} from="bottom">
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                  Your Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full h-11 rounded-xl border border-border-input bg-bg-card px-4 text-sm text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-text-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-xl border border-border-input bg-bg-card px-4 text-sm text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-text-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Subject
              </label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="What is this about?"
                className="w-full h-11 rounded-xl border border-border-input bg-bg-card px-4 text-sm text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-text-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what you need help with..."
                className="w-full rounded-xl border border-border-input bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-text-primary focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-status-rejected-text text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-text-primary text-bg-base font-black uppercase tracking-widest text-sm rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          </ScrollReveal>
        )}
      </div>

      <Footer />
    </div>
  );
}
