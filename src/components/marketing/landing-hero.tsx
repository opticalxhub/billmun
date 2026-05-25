'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Menu, Play, X } from 'lucide-react';
import gsap from 'gsap';
import { ASCII8Ball } from '@/components/ascii-8ball';
import { FadeIn, ScaleIn, ScrollReveal } from '@/components/gsap-animations';

export type LandingGalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
  status: string | null;
};

type LandingHeroProps = {
  gallery: LandingGalleryItem[];
};

export function LandingHero({ gallery }: LandingHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRefs.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2,
      });

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

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (gallery.length <= 1 || playingVideo) {
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % gallery.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [gallery.length, playingVideo]);

  const goToPrev = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex((previous) => (previous - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const goToNext = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex((previous) => (previous + 1) % gallery.length);
  }, [gallery.length]);

  const visibleItems = useMemo(() => {
    if (gallery.length === 0) {
      return [];
    }

    const count = Math.min(gallery.length, 5);
    const half = Math.floor(count / 2);
    const items: { item: LandingGalleryItem; position: number; isActive: boolean }[] = [];
    const usedIds = new Set<string>();

    for (let i = -half; i <= half; i += 1) {
      if (items.length >= count) {
        break;
      }

      const idx = (activeIndex + i + gallery.length) % gallery.length;
      const item = gallery[idx];
      if (usedIds.has(item.id)) {
        continue;
      }

      usedIds.add(item.id);
      items.push({ item, position: i, isActive: i === 0 });
    }

    return items;
  }, [activeIndex, gallery]);

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border-subtle bg-bg-base/80 px-4 py-5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-jotia text-2xl uppercase tracking-[0.2em] text-brand-crimson">
            NXTMUN
          </Link>
          <div className="hidden items-center gap-6 text-xs font-bold uppercase tracking-widest text-text-secondary sm:flex">
            <a href="#about" className="transition-colors hover:text-text-primary">About</a>
            <Link href="/gallery" className="transition-colors hover:text-text-primary">Gallery</Link>
            <Link href="/socials" className="transition-colors hover:text-text-primary">Socials</Link>
            <Link href="/contact" className="transition-colors hover:text-text-primary">Contact</Link>
            <Link href="/login" className="transition-colors hover:text-text-primary">Portal</Link>
          </div>
          <button
            className="p-2 sm:hidden"
            onClick={() => setMobileMenu((previous) => !previous)}
            aria-label={mobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenu && (
          <div className="mt-4 space-y-3 border-t pt-4 sm:hidden">
            <a href="#about" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">About</a>
            <Link href="/gallery" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Gallery</Link>
            <Link href="/socials" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Socials</Link>
            <Link href="/contact" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Contact</Link>
            <Link href="/login" onClick={() => setMobileMenu(false)} className="block text-sm uppercase">Portal</Link>
          </div>
        )}
      </nav>

      <section ref={heroRef} className="relative min-h-screen px-6 pb-20 pt-40 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <ScaleIn delay={0.2} from={0.8}>
            <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="font-jotia text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                  <div ref={(el) => { headingRefs.current[0] = el; }}>BUILD.</div>
                  <div ref={(el) => { headingRefs.current[1] = el; }}>INSPIRE.</div>
                  <div ref={(el) => { headingRefs.current[2] = el; }}>LEAD.</div>
                </h1>
                <p ref={subtitleRef} className="mt-6 max-w-2xl text-xl text-text-secondary sm:text-2xl">
                  Join us for NXTMUN, the premier conference that sets a new standard for Model United Nations in the region.
                </p>
                <p className="mt-4 font-bold italic text-zinc-200 drop-shadow-md">
                  By Alaa Abbadi &amp; Kenan Nezar
                </p>
              </div>
              <div className="hidden h-64 w-64 shrink-0 text-text-primary/60 lg:block">
                <ASCII8Ball className="h-full w-full" />
              </div>
            </div>
          </ScaleIn>

          {gallery.length > 0 && (
            <ScrollReveal delay={0.6} from="bottom">
              <div className="relative px-14">
                {gallery.length > 1 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      goToPrev();
                    }}
                    className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white transition-colors hover:bg-black/90"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                <div className="flex items-stretch justify-center gap-2 overflow-hidden sm:gap-3">
                  {visibleItems.map(({ item, position, isActive }) => (
                    <div
                      key={`${item.id}-${position}`}
                      onClick={() => !isActive && setActiveIndex((activeIndex + position + gallery.length) % gallery.length)}
                      className={`relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-500 ${
                        isActive
                          ? 'z-10 aspect-[4/3] w-[40%] ring-2 ring-accent-gold/40 sm:w-[36%]'
                          : 'aspect-[4/3] w-[15%] grayscale opacity-40 hover:opacity-60 sm:w-[16%]'
                      }`}
                    >
                      {item.media_type?.startsWith('video') ? (
                        <div className="relative h-full w-full bg-black">
                          <video
                            key={`video-${item.id}`}
                            src={item.media_url}
                            className="h-full w-full object-cover"
                            muted={!isActive}
                            autoPlay={isActive && playingVideo === item.id}
                            controls={isActive && playingVideo === item.id}
                            preload="none"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isActive) {
                                setPlayingVideo(item.id);
                              }
                            }}
                          />
                          {isActive && playingVideo !== item.id && (
                            <div
                              className="absolute inset-0 flex items-center justify-center bg-black/40"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPlayingVideo(item.id);
                              }}
                            >
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 transition-transform hover:scale-110">
                                <Play className="ml-1 h-7 w-7 text-black" fill="currentColor" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Image
                          src={item.media_url}
                          alt={item.caption || 'NXTMUN gallery image'}
                          fill
                          sizes={isActive ? '(max-width: 640px) 40vw, 36vw' : '(max-width: 640px) 15vw, 16vw'}
                          className="object-cover"
                          priority={isActive}
                        />
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <p className="flex-1 truncate text-xs text-white/90">{item.caption || 'No caption'}</p>
                            {item.status && (
                              <span className={`ml-2 rounded px-2 py-1 text-xs ${
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
                    onClick={(event) => {
                      event.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white transition-colors hover:bg-black/90"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
                {gallery.length > 1 && (
                  <div className="mt-4 flex justify-center gap-1.5">
                    {gallery.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-accent-gold' : 'bg-white/30 hover:bg-white/50'}`}
                        aria-label={`View gallery item ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          <FadeIn delay={0.8} from="bottom">
            <p className="mt-8 text-center text-sm uppercase tracking-widest text-text-dimmed">
              Yarmook Elementary Private School Dhahran • Model United Nations
            </p>
          </FadeIn>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 transform animate-bounce">
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-text-dimmed">
            <div className="mt-2 h-3 w-1 animate-pulse rounded-full bg-text-dimmed" />
          </div>
        </div>
      </section>
    </>
  );
}
