'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border-subtle bg-bg-card py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">BILLMUN</h4>
            <p className="text-sm text-text-tertiary max-w-xs">
              The premier Model United Nations platform for delegates and organizers worldwide.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/acceptable-use" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">Contact</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@billmun.com" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">support@billmun.com</a></li>
              <li><a href="https://instagram.com/billmun.sa" target="_blank" rel="noopener noreferrer" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 text-center text-xs text-text-tertiary uppercase tracking-widest">
          &copy; {year || 2026} BILLMUN Organization. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
