'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function PublicNavbar() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 backdrop-blur-md bg-bg-base/80 border-b border-border-subtle">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-jotia text-2xl tracking-[0.2em] uppercase">
          BILLMUN
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-text-secondary">
          <a href="#about" className="hover:text-text-primary transition-colors">About</a>
          <Link href="/gallery" className="hover:text-text-primary transition-colors">Gallery</Link>
          <Link href="/socials" className="hover:text-text-primary transition-colors">Socials</Link>
          <Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
          <Link href="/login" className="hover:text-text-primary transition-colors">Portal</Link>
        </div>

        <button
          className="sm:hidden p-2"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenu && (
        <div className="sm:hidden mt-4 border-t pt-4 space-y-3">
          <a href="#about" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">About</a>
          <Link href="/gallery" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Gallery</Link>
          <Link href="/socials" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Socials</Link>
          <Link href="/contact" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Contact</Link>
          <Link href="/login" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Portal</Link>
        </div>
      )}
    </nav>
  );
}
