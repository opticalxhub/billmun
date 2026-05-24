'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Menu, X, Play } from 'lucide-react';
import { Footer } from '@/components/footer';
import gsap from 'gsap';

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
  status: string | null;
};

export default function LandingPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setMounted(true);

    const ctx = gsap.context(() => {
      gsap.from(headingRefs.current.filter(Boolean), {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.1,
      });
      if (subtitleRef.current) {
        gsap.from(subtitleRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.7,
        });
      }
    }, heroRef);

    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => { setGallery(d.items || []); })
      .catch(() => {});

    return () => ctx.revert();
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
    <div className="min-h-screen bg-bg-base text-text-primary font-jotia flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 bg-bg-base/85 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-jotia text-xl tracking-[0.2em] uppercase">
            NXTMUN
          </Link>
          <div className="hidden sm:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            <a href="#about" className="hover:text-text-primary transition-colors">About</a>
            <Link href="/gallery" className="hover:text-text-primary transition-colors">Gallery</Link>
            <Link href="/socials" className="hover:text-text-primary transition-colors">Socials</Link>
            <Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-rust-500 transition-colors">Portal</Link>
          </div>
          <button className="sm:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden mt-4 border-t border-border-subtle pt-4 space-y-3">
            <a href="#about" onClick={() => setMobileMenu(false)} className="block text-xs uppercase tracking-widest">About</a>
            <Link href="/gallery" onClick={() => setMobileMenu(false)} className="block text-xs uppercase tracking-widest">Gallery</Link>
            <Link href="/socials" onClick={() => setMobileMenu(false)} className="block text-xs uppercase tracking-widest">Socials</Link>
            <Link href="/contact" onClick={() => setMobileMenu(false)} className="block text-xs uppercase tracking-widest">Contact</Link>
            <Link href="/login" onClick={() => setMobileMenu(false)} className="block text-xs uppercase tracking-widest text-rust-500">Portal</Link>
          </div>
        )}
      </nav>

      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center px-6 sm:px-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-text-tertiary">
            <span className="block w-8 h-px bg-rust-500" />
            <span>NXTMUN I &mdash; III &amp; IV April</span>
          </div>

          <h1 className="font-jotia font-bold leading-[0.92] tracking-tight text-[clamp(3.25rem,11vw,9.5rem)]">
            <div ref={el => { headingRefs.current[0] = el; }}>NEGOTIATE.</div>
            <div ref={el => { headingRefs.current[1] = el; }}>EXCHANGE.</div>
            <div ref={el => { headingRefs.current[2] = el; }} className="text-rust-500">TRANSFORM.</div>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-10 max-w-xl text-base sm:text-lg text-text-secondary leading-relaxed"
          >
            The inaugural Model United Nations conference setting a new standard for student-led diplomacy in the region.
          </p>
        </div>

        <div className="absolute bottom-10 left-6 sm:left-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-text-tertiary">
          <span className="block w-8 h-px bg-text-tertiary" />
          Scroll
        </div>
      </section>

      {mounted && gallery.length > 0 && (
        <section className="px-6 sm:px-10 py-20 border-t border-border-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary mb-3">Field Notes</p>
                <h2 className="font-jotia text-3xl sm:text-4xl font-bold tracking-tight">From the floor.</h2>
              </div>
              {gallery.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="p-3 border border-border-subtle hover:border-rust-500 hover:text-rust-500 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-3 border border-border-subtle hover:border-rust-500 hover:text-rust-500 transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-stretch gap-3 overflow-hidden">
              {visibleItems.map(({ item, position, isActive }) => (
                <div
                  key={`${item.id}-${position}`}
                  onClick={() => !isActive && setActiveIndex((activeIndex + position + gallery.length) % gallery.length)}
                  className={`relative transition-all duration-500 cursor-pointer overflow-hidden flex-shrink-0 ${
                    isActive
                      ? 'w-[58%] sm:w-[52%] aspect-[4/3]'
                      : 'w-[14%] sm:w-[16%] aspect-[4/3] opacity-30 grayscale hover:opacity-60'
                  }`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isActive) setPlayingVideo(item.id);
                        }}
                      />
                      {isActive && playingVideo !== item.id && (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/30"
                          onClick={(e) => { e.stopPropagation(); setPlayingVideo(item.id); }}
                        >
                          <div className="w-14 h-14 rounded-full bg-paper flex items-center justify-center">
                            <Play className="w-6 h-6 text-bg-base ml-1" fill="currentColor" />
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
                  {isActive && item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs text-white/80 uppercase tracking-widest truncate">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="about" className="py-32 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary mb-6">On NXTMUN</p>
          <h2 className="font-jotia text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-12">
            A student-led Model UN built on three words.
          </h2>

          <div className="space-y-10 text-lg leading-relaxed text-text-secondary">
            <p>
              <span className="text-text-primary">Negotiate</span> &mdash; the diplomatic core of every committee. Disciplined debate, sharp argument, the pursuit of consensus.
            </p>
            <p>
              <span className="text-text-primary">Exchange</span> &mdash; the meeting of perspectives, cultures, and ideas that makes Model UN matter beyond the resolution.
            </p>
            <p>
              <span className="text-text-primary">Transform</span> &mdash; what delegates carry forward. Sharper thinking, stronger leadership, a wider view of the world.
            </p>
          </div>

          <div className="mt-24 pt-16 border-t border-border-subtle">
            <p className="text-[11px] uppercase tracking-[0.3em] text-rust-500 mb-6">NXTMUN I &mdash; III &amp; IV April</p>
            <p className="text-lg leading-relaxed text-text-secondary max-w-2xl">
              Our first edition is the foundation of a long-term vision: a leading platform for Model UN in the region.
              Focused, well-regulated, academically strong &mdash; designed not to meet expectations, but to set the standard
              every future NXTMUN initiative will be measured against.
            </p>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary mb-4">The Executive Board</p>
            <h2 className="font-jotia text-4xl sm:text-5xl font-bold tracking-tight">Meet the team.</h2>
          </div>
          <div className="relative w-full overflow-hidden bg-black">
            <video
              key="team-video"
              src="/billeb.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[75vh]"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary mb-6">Delegates &amp; Staff</p>
          <h2 className="font-jotia text-4xl sm:text-5xl font-bold tracking-tight mb-10">
            Enter the conference portal.
          </h2>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-rust-500 text-paper text-xs uppercase tracking-[0.3em] hover:bg-rust-600 transition-colors"
          >
            Open Portal
          </Link>
          <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-text-tertiary">
            Yarmook Elementary Private School &mdash; Dhahran
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
