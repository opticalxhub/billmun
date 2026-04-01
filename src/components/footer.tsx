'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-card py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Logo + BILLMUN text */}
          <div className="flex items-center gap-3">
            <Image
              src="/billmun.png"
              alt="BILLMUN"
              width={40}
              height={40}
              className="w-10 h-10 object-contain dark:invert"
              unoptimized
            />
            <span className="font-jotia text-xl tracking-widest uppercase text-text-primary">
              BILLMUN
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-jotia font-bold uppercase tracking-widest text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            <Link href="/gallery" className="hover:text-text-primary transition-colors">Gallery</Link>
            <Link href="/socials" className="hover:text-text-primary transition-colors">Socials</Link>
            <Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs font-jotia text-text-tertiary uppercase tracking-widest">
            © 2026 BILLMUN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
