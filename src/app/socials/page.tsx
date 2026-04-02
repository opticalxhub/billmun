'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/footer';
import { PublicNavbar } from '@/components/public-navbar';
import { FadeIn, ScaleIn, HoverScale } from '@/components/gsap-animations';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-inter flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <FadeIn delay={0.1} from="top">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors mb-12">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </FadeIn>

        <FadeIn delay={0.2} from="bottom">
          <div className="text-center mb-16">
            <h1 className="font-jotia text-5xl md:text-7xl mb-4 tracking-tight">Our Socials</h1>
            <p className="text-text-secondary max-w-md mx-auto">
              Stay connected with BILLMUN. Follow us for updates, highlights, and behind-the-scenes content.
            </p>
          </div>
        </FadeIn>

        {/* BILLM[instagram]N styled title */}
        <ScaleIn delay={0.4} from={0.85}>
        <div className="flex items-center justify-center gap-0 mb-12">
          <span className="font-jotia text-6xl md:text-8xl lg:text-9xl tracking-tight text-text-primary">BILLM</span>
          <a
            href="https://instagram.com/billmun.sa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center mx-1 hover:scale-110 transition-transform"
          >
            <InstagramIcon className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 text-text-primary hover:text-[#E1306C] transition-colors" />
          </a>
          <span className="font-jotia text-6xl md:text-8xl lg:text-9xl tracking-tight text-text-primary">N</span>
        </div>
        </ScaleIn>

        {/* Large Instagram button */}
        <FadeIn delay={0.6} from="bottom">
        <HoverScale scale={1.05}>
        <a
          href="https://instagram.com/billmun.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-base rounded-full font-black uppercase tracking-widest text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <InstagramIcon className="w-7 h-7" />
          <span>Follow @billmun</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        </HoverScale>
        </FadeIn>

        <FadeIn delay={0.7} from="bottom">
        <p className="text-text-tertiary text-xs uppercase tracking-widest mt-8">
          @billmun on Instagram
        </p>
        </FadeIn>
      </div>

      <Footer />
    </div>
  );
}
