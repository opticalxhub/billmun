'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FadeIn, ScaleIn, ScrollReveal, StaggerContainer, TextReveal, HoverScale } from '@/components/gsap-animations';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Menu, X, Play } from 'lucide-react';
import { Footer } from '@/components/footer';
import { ASCII8Ball } from '@/components/ascii-8ball';
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
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setMounted(true);

    // GSAP hero entrance animations
    const ctx = gsap.context(() => {
      // Stagger heading lines
      gsap.from(headingRefs.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2,
      });

      // Subtitle fade in
      if (subtitleRef.current) {
        gsap.from(subtitleRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.7,
        });
      }
    }, heroRef);

    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => { setGallery(d.items || []); setGalleryLoaded(true); })
      .catch(() => setGalleryLoaded(true));

    return () => ctx.revert();
  }, []);

  // Auto-advance carousel — pause when video is playing
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

  // Show up to 5 unique items centered around activeIndex
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
      {/* Navigation */}
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
          <button className="sm:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
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

      {/* Hero Section with Gallery Carousel */}
      <section ref={heroRef} className="relative min-h-screen pt-40 pb-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          {/* BUILD. INSPIRE. LEAD. Header + 8-Ball */}
          <ScaleIn delay={0.2} from={0.8}>
            <div className="mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <h1 className="font-jotia text-6xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
                  <div ref={el => { headingRefs.current[0] = el; }}>BUILD.</div>
                  <div ref={el => { headingRefs.current[1] = el; }}>INSPIRE.</div>
                  <div ref={el => { headingRefs.current[2] = el; }}>LEAD.</div>
                </h1>
                <p ref={subtitleRef} className="text-xl sm:text-2xl text-text-secondary mt-6 max-w-2xl">
                  Join us for BILLMUN I, the inaugural conference that sets a new standard for Model United Nations in the region.
                </p>
                <p className="mt-4 italic font-bold text-zinc-200 drop-shadow-md">
                  By Alaa Abbadi & Kenan Nezar
                </p>
              </div>
              <div className="hidden lg:block w-64 h-64 text-text-primary/60 shrink-0">
                <ASCII8Ball className="w-full h-full" />
              </div>
            </div>
          </ScaleIn>

          {/* Gallery Carousel */}
          {mounted && gallery.length > 0 && (
            <ScrollReveal delay={0.6} from="bottom">
              <div className="relative px-14">
                {gallery.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black/90 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="flex items-stretch justify-center gap-2 sm:gap-3 overflow-hidden">
                  {visibleItems.map(({ item, position, isActive }) => (
                    <div
                      key={`${item.id}-${position}`}
                      onClick={() => !isActive && setActiveIndex((activeIndex + position + gallery.length) % gallery.length)}
                      className={`relative transition-all duration-500 cursor-pointer overflow-hidden rounded-xl flex-shrink-0 ${
                        isActive
                          ? 'w-[40%] sm:w-[36%] aspect-[4/3] z-10 ring-2 ring-accent-gold/40'
                          : 'w-[15%] sm:w-[16%] aspect-[4/3] opacity-40 grayscale hover:opacity-60'
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
                              className="absolute inset-0 flex items-center justify-center bg-black/40"
                              onClick={(e) => { e.stopPropagation(); setPlayingVideo(item.id); }}
                            >
                              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
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
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-white/90 truncate flex-1">{item.caption || 'No caption'}</p>
                            {item.status && (
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                item.status === 'APPROVED' ? 'bg-green-500/80 text-white' :
                                item.status === 'PENDING' ? 'bg-yellow-500/80 text-white' :
                                item.status === 'REJECTED' ? 'bg-red-500/80 text-white' :
                                'bg-gray-500/80 text-white'
                              }`}>
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {gallery.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black/90 transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                {/* Dot indicators */}
                {gallery.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-accent-gold w-6' : 'bg-white/30 hover:bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          <FadeIn delay={0.8} from="bottom">
            <p className="text-sm text-text-dimmed mt-8 uppercase tracking-widest text-center">
              Yarmook Elementary Private School Dhahran • Model United Nations
            </p>
          </FadeIn>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-text-dimmed rounded-full flex justify-center">
            <div className="w-1 h-3 bg-text-dimmed rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <ScrollReveal from="bottom">
        <section id="about" className="py-20 px-6 sm:px-10 bg-bg-card/30">
          <div className="max-w-4xl mx-auto">
            <p className="font-jotia text-lg leading-relaxed mb-6">
              <strong>BILLMUN</strong> is a student led Model United Nations initiative built around the idea of <strong>Build Inspire Lead</strong>. These three words represent our approach to conference design and student development.
            </p>
            <div className="space-y-4 mb-6">
              <p className="font-jotia text-lg leading-relaxed">
                <strong>Build</strong> reflects our belief that every delegate should have the opportunity to grow.
              </p>
              <p className="font-jotia text-lg leading-relaxed">
                <strong>Inspire</strong> stands for the professional environment we work to create in every committee room.
              </p>
              <p className="font-jotia text-lg leading-relaxed">
                <strong>Lead</strong> represents our commitment to encouraging new ideas, new leaders and new perspectives.
              </p>
            </div>
            <p className="font-jotia text-lg leading-relaxed mb-12">
              Our aim is to raise the standard of MUN in the region and provide a platform where students engage with international issues in a disciplined, well structured and academically strong setting.
            </p>
            <div className="mb-12">
              <h2 className="font-jotia text-3xl font-bold mb-6">BILLMUN I</h2>
              <p className="font-jotia text-lg leading-relaxed mb-4">
                BILLMUN I, scheduled for <strong>3–4 April</strong>, marks the official launch of the conference. As our first edition, it represents the foundation of a long-term vision to establish a leading Model United Nations platform.
              </p>
              <p className="font-jotia text-lg leading-relaxed mb-4">
                The conference is structured to deliver a focused and high-quality debate experience, bringing together delegates across multiple committees within a professional and well-regulated setting.
              </p>
              <p className="font-jotia text-lg leading-relaxed mb-4">
                With an emphasis on clarity, organization and academic depth, BILLMUN I is designed not only to meet expectations, but to set a new benchmark for student-led conferences in the region.
              </p>
              <p className="font-jotia text-lg leading-relaxed">
                This first conference is more than a starting point — it is the standard upon which all future BILLMUN initiatives will be built.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Announcements Section */}
      <ScrollReveal from="bottom">
        <section className="py-20 px-6 sm:px-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-jotia text-3xl sm:text-4xl font-bold mb-8 text-center">Latest Announcements</h2>
            <div className="bg-bg-card/50 border border-border-subtle rounded-xl p-8 text-center">
              <p className="text-text-secondary">Stay tuned for official announcements about BILLMUN I.</p>
              <HoverScale scale={1.05}>
                <Link
                  href="/login"
                  className="inline-block mt-6 px-8 py-3 bg-text-primary text-bg-base rounded-full font-bold uppercase tracking-widest hover:bg-text-primary/90 transition-colors"
                >
                  Enter Portal
                </Link>
              </HoverScale>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Meet The Team Section */}
      <ScrollReveal from="bottom">
        <section className="py-24 px-6 sm:px-10 bg-bg-card/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-jotia text-4xl sm:text-5xl mb-12 tracking-tight text-center">MEET THE TEAM</h2>
            <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video
                key="team-video"
                src="/billeb.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto max-h-[70vh]"
                style={{ display: 'block' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-center text-text-secondary mt-8 text-sm uppercase tracking-widest">
              Get to know the Executive Board behind BILLMUN
            </p>
          </div>
        </section>
      </ScrollReveal>

      <Footer />
    </div>
  );
}
