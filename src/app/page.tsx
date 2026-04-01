'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Menu, X, Play } from 'lucide-react';
import { Footer } from '@/components/footer';

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
};

export default function LandingPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => { setGallery(d.items || []); setGalleryLoaded(true); })
      .catch(() => setGalleryLoaded(true));
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

  // Only render 5 items (virtualized) — handles 200+ assets efficiently
  const visibleItems = useMemo(() => {
    if (gallery.length === 0) return [];
    const items = [];
    for (let i = -2; i <= 2; i++) {
      const idx = (activeIndex + i + gallery.length) % gallery.length;
      items.push({ item: gallery[idx], position: i, isActive: i === 0 });
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

      {/* Hero Section with Gallery Carousel */}
      <section className="relative min-h-screen pt-40 pb-20 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto">
            {/* BUILD. INSPIRE. LEAD. Header */}
            <div className="mb-12">
              <h1 className="font-jotia text-6xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
                <div>BUILD.</div>
                <div>INSPIRE.</div>
                <div>LEAD.</div>
              </h1>
              <p className="text-xl sm:text-2xl text-text-secondary mt-6 max-w-2xl">
                Join us for BILLMUN I, the inaugural conference that sets a new standard for Model United Nations in the region.
              </p>
            </div>

            {/* Gallery Carousel — only renders 5 items at a time for performance */}
            {mounted && (
              <div className="relative">
              {gallery.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="flex items-center justify-center gap-3 px-12 min-h-[200px]">
                {visibleItems.length > 0 ? (
                  visibleItems.map(({ item, position, isActive }) => (
                    <div
                      key={`${item.id}-${position}`}
                      onClick={() => !isActive && setActiveIndex((activeIndex + position + gallery.length) % gallery.length)}
                      className={`relative transition-all duration-500 cursor-pointer overflow-hidden rounded-xl ${
                        isActive 
                          ? 'flex-[2] aspect-[4/3] z-10 scale-105' 
                          : 'flex-1 aspect-[4/3] opacity-40 grayscale hover:opacity-60'
                      }`}
                    >
                      {item.media_type?.startsWith('video') ? (
                        <div className="relative w-full h-full bg-black">
                          <video 
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingVideo(item.id);
                              }}
                            >
                              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
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
                  ))
                ) : galleryLoaded ? (
                  <div className="flex-1 flex items-center justify-center py-16">
                    <p className="text-text-dimmed text-sm font-jotia">No media yet</p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {gallery.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  {/* Dot indicators */}
                  <div className="flex justify-center mt-4 gap-1.5">
                    {gallery.length <= 20 ? gallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    )) : (
                      <p className="text-text-dimmed text-xs">{activeIndex + 1} / {gallery.length}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Section - REIMUN Style */}
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

          {/* BILLMUN I Section */}
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

      {/* Announcements Section */}
      <section className="py-20 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-jotia text-3xl sm:text-4xl font-bold mb-8 text-center">Latest Announcements</h2>
          <div className="bg-bg-card/50 border border-border-subtle rounded-xl p-8 text-center">
            <p className="text-text-secondary">Stay tuned for official announcements about BILLMUN I.</p>
            <Link 
              href="/login" 
              className="inline-block mt-6 px-8 py-3 bg-text-primary text-bg-base rounded-full font-bold uppercase tracking-widest hover:bg-text-primary/90 transition-colors"
            >
              Enter Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Meet The Team Section */}
      <section className="py-24 px-6 sm:px-10 bg-bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-jotia text-4xl sm:text-5xl mb-12 tracking-tight text-center">MEET THE TEAM</h2>
          
          <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl">
            <video
              src="/billeb.mp4"
              controls
              playsInline
              preload="auto"
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

      <Footer/>
    </div>
  );
}
