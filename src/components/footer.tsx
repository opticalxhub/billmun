'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ─────────────────────────────────────────────────────────────────────
   Footer — NXTMUN
   Stripped, editorial. No cards, no boxes. Border-top dividers only.
   ───────────────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer
      className="py-12 px-6 md:px-10 lg:px-16"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
        {/* Left — brand */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-3 w-fit group" aria-label="NXTMUN home">
            <Image
              src="/billmun.png"
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 object-contain opacity-60 group-hover:opacity-80 transition-opacity"
              unoptimized
              aria-hidden
            />
            <span
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              NXTMUN
            </span>
          </Link>
          <p
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: '12px',
              color: 'var(--text-disabled)',
              lineHeight: 1.5,
              maxWidth: '260px',
            }}
          >
            Navigate. Execute. Transform.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-disabled)',
              letterSpacing: '0.08em',
            }}
          >
            &copy; 2026 NXTMUN. All rights reserved.
          </p>
        </div>

        {/* Right — links */}
        <nav
          className="flex flex-wrap items-end gap-x-6 gap-y-2"
          aria-label="Footer navigation"
        >
          {[
            { href: '/', label: 'Home' },
            { href: '/committees', label: 'Committees' },
            { href: '/gallery', label: 'Gallery' },
            { href: '/socials', label: 'Socials' },
            { href: '/contact', label: 'Contact' },
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                transition: 'color 180ms ease',
              }}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--text-secondary)')}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--text-tertiary)')}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
