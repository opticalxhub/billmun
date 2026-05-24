'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Footer } from '@/components/footer';
import { PublicNavbar } from '@/components/public-navbar';

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
  status: string | null;
};

/* ─────────────────────────────────────────────────────────────────────
   LandingPage — NXTMUN
   Aesthetic: landonorris.com × classified dossier
   One dominant element per section. Massive type. Asymmetric. Rust accent.
   ───────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => { setGallery(d.items || []); setGalleryLoaded(true); })
      .catch(() => setGalleryLoaded(true));
  }, []);

  useEffect(() => {
    if (gallery.length <= 1 || playingVideo) return;
    autoPlayRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % gallery.length);
    }, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [gallery.length, playingVideo]);

  const goToPrev = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex(prev => (prev - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const goToNext = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex(prev => (prev + 1) % gallery.length);
  }, [gallery.length]);

  const visibleItems = useMemo(() => {
    if (gallery.length === 0) return [];
    const count = Math.min(gallery.length, 5);
    const half = Math.floor(count / 2);
    const items: { item: GalleryItem; position: number; isActive: boolean }[] = [];
    const usedIds = new Set<string>();
    for (let i = -half; i <= half; i++) {
      if (items.length >= count) break;
      const idx = (activeIndex + i + gallery.length) % gallery.length;
      const item = gallery[idx];
      if (usedIds.has(item.id)) continue;
      usedIds.add(item.id);
      items.push({ item, position: i, isActive: i === 0 });
    }
    return items;
  }, [gallery, activeIndex]);

  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary flex flex-col">
      <PublicNavbar />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[100dvh] flex flex-col justify-end pb-16 md:pb-20 px-6 md:px-10 lg:px-16 pt-24"
        aria-label="Hero"
      >
        {/* Ambient radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(139,69,19,0.04) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,0,0,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Conference label — top left, quietly positioned */}
        <div
          className="absolute top-24 left-6 md:left-10 lg:left-16"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Model United Nations &mdash; 2026
        </div>

        {/* Massive left-aligned headline */}
        <div className="relative z-10 max-w-7xl w-full">
          <div
            className="overflow-hidden"
            style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
          >
            <h1
              className="font-condensed uppercase text-balance"
              style={{
                fontSize: 'clamp(5rem, 14vw, 11rem)',
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              NXT
              <span style={{ color: 'var(--rust-400)' }}>MUN</span>
            </h1>
          </div>

          {/* Tagline — left aligned, below headline, breathing room */}
          <div
            className="mt-8 md:mt-10 max-w-lg"
            style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              A student-led Model United Nations conference. One standard. No shortcuts.
              Three words that define how we work.
            </p>

            {/* NXT acronym breakdown */}
            <div
              className="mt-8 flex flex-col gap-2"
              style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both' }}
            >
              {[
                { letter: 'N', word: 'Navigate' },
                { letter: 'X', word: 'Execute' },
                { letter: 'T', word: 'Transform' },
              ].map(({ letter, word }) => (
                <div key={letter} className="flex items-baseline gap-3">
                  <span
                    style={{
                      fontFamily: 'var(--font-barlow-condensed)',
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: 'var(--rust-400)',
                      width: '14px',
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-barlow)',
                      fontSize: '13px',
                      color: 'var(--text-tertiary)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div
            className="mt-10 flex items-center gap-5"
            style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both' }}
          >
            <Link
              href="/register"
              className="flex items-center h-12 px-6 transition-all active:scale-[0.98]"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--rust-500)',
                border: '1px solid var(--rust-400)',
                borderRadius: '2px',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--rust-400)')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--rust-500)')}
            >
              Apply Now
            </Link>
            <Link
              href="#about"
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.02em',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1px',
                transition: 'color 180ms ease, border-color 180ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--text-secondary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-subtle)';
              }}
            >
              Learn more
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 right-10 hidden md:block"
          style={{ animation: 'fade-in 1s ease 1s both' }}
          aria-hidden
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--text-disabled)',
              letterSpacing: '0.18em',
              writingMode: 'vertical-rl',
              textTransform: 'uppercase',
            }}
          >
            Scroll
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────── */}
      <section
        id="about"
        className="py-28 md:py-36 px-6 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left — large section label + headline */}
          <div>
            <p
              className="mb-6"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-rust)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              About
            </p>
            <h2
              className="font-condensed uppercase text-balance"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
              }}
            >
              A new standard for MUN in the region
            </h2>
          </div>

          {/* Right — body copy */}
          <div className="lg:pt-12 space-y-6">
            <p
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '16px',
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
              }}
            >
              NXTMUN is built around three words that define how we work:
              Navigate, Execute, Transform. Not as decoration — as operating principles.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '16px',
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
              }}
            >
              Every delegate should have room to grow. Every committee should be run
              with precision. Every conference should set a new benchmark — not repeat
              the last one.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '16px',
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
              }}
            >
              NXTMUN I, scheduled for <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>3–4 April 2026</strong>,
              is the inaugural edition. The foundation. The standard everything after it
              will be measured against.
            </p>
          </div>
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────────── */}
      {mounted && (
        <section
          className="py-20 px-6 md:px-10 lg:px-16"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="max-w-7xl mx-auto">
            <p
              className="mb-10"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-rust)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Gallery
            </p>

            {gallery.length > 0 ? (
              <div className="relative">
                {/* Carousel */}
                <div className="flex items-stretch justify-center gap-2 sm:gap-3 overflow-hidden">
                  {visibleItems.map(({ item, position, isActive }) => (
                    <div
                      key={`${item.id}-${position}`}
                      onClick={() => !isActive && setActiveIndex((activeIndex + position + gallery.length) % gallery.length)}
                      className="relative transition-all duration-500 cursor-pointer overflow-hidden flex-shrink-0"
                      style={{
                        width: isActive ? '42%' : '14%',
                        aspectRatio: '4/3',
                        opacity: isActive ? 1 : 0.35,
                        filter: isActive ? 'none' : 'grayscale(60%)',
                        borderRadius: '2px',
                      }}
                    >
                      {item.media_type?.startsWith('video') ? (
                        <div className="relative w-full h-full bg-black">
                          <video
                            key={`video-${item.id}`}
                            src={item.media_url}
                            className="w-full h-full object-cover"
                            muted={!isActive}
                            autoPlay={isActive && playingVideo === item.id}
                            controls={isActive && playingVideo === item.id}
                            preload="none"
                          />
                          {isActive && playingVideo !== item.id && (
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                              onClick={e => { e.stopPropagation(); setPlayingVideo(item.id); }}
                            >
                              <div
                                className="flex items-center justify-center"
                                style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)' }}
                              >
                                <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.caption || ''}
                          className="w-full h-full object-cover"
                          loading={isActive ? 'eager' : 'lazy'}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                {gallery.length > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPrev}
                        className="flex items-center justify-center w-9 h-9 transition-all active:scale-[0.96]"
                        style={{
                          border: '1px solid var(--border-emphasized)',
                          borderRadius: '2px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-emphasized)')}
                        aria-label="Previous"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="flex items-center justify-center w-9 h-9 transition-all active:scale-[0.96]"
                        style={{
                          border: '1px solid var(--border-emphasized)',
                          borderRadius: '2px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-emphasized)')}
                        aria-label="Next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIndex(i)}
                          className="transition-all duration-300"
                          style={{
                            width: i === activeIndex ? '20px' : '6px',
                            height: '6px',
                            borderRadius: '9999px',
                            backgroundColor: i === activeIndex ? 'var(--rust-400)' : 'var(--border-emphasized)',
                            cursor: 'pointer',
                          }}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : galleryLoaded ? (
              <p
                style={{
                  fontFamily: 'var(--font-barlow)',
                  fontSize: '14px',
                  color: 'var(--text-tertiary)',
                }}
              >
                Gallery coming soon.
              </p>
            ) : null}
          </div>
        </section>
      )}

      {/* ── ANNOUNCEMENTS ───────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div>
            <p
              className="mb-5"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-rust)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Portal Access
            </p>
            <h2
              className="font-condensed uppercase"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                maxWidth: '540px',
              }}
            >
              Announcements and updates live inside the portal
            </h2>
          </div>
          <div className="flex flex-col gap-4 lg:items-end lg:text-right">
            <p
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                maxWidth: '300px',
                lineHeight: 1.7,
              }}
            >
              Delegates, chairs, press, and security access real-time committee information, documents, and communications after logging in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center h-11 px-6 w-fit transition-all active:scale-[0.98]"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--rust-500)',
                border: '1px solid var(--rust-400)',
                borderRadius: '2px',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--rust-400)')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--rust-500)')}
            >
              Enter Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ── MEET THE TEAM ───────────────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-7xl mx-auto">
          <p
            className="mb-10"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-rust)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            The Team
          </p>
          <h2
            className="font-condensed uppercase mb-12"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 0.92,
              color: 'var(--text-primary)',
            }}
          >
            Executive Board
          </h2>

          <div
            className="relative w-full overflow-hidden"
            style={{ borderRadius: '2px', maxWidth: '760px' }}
          >
            <video
              key="team-video"
              src="/billeb.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto block"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <p
            className="mt-6"
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: '13px',
              color: 'var(--text-tertiary)',
            }}
          >
            By Alaa Abbadi &amp; Kenan Nezar
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
