'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FadeIn, ScaleIn, ScrollReveal, StaggerContainer, HoverScale } from '@/components/gsap-animations';
import { Footer } from '@/components/footer';
import { PublicNavbar } from '@/components/public-navbar';

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
  created_at: string;
  uploader_id: string | null;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Failed to load gallery');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error('Gallery fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'image') return !item.media_type?.startsWith('video');
    if (filter === 'video') return item.media_type?.startsWith('video');
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-inter">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-24">
        <div className="mb-10">
          <FadeIn delay={0.2} from="top">
            <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </FadeIn>
          <ScaleIn delay={0.3} from={0.9}>
            <div className="max-w-7xl mx-auto">
              <h1 className="font-jotia text-5xl md:text-6xl mb-3">Gallery</h1>
              <p className="text-text-secondary mb-2 max-w-lg">
                Browse photos and videos from BILLMUN — captured by our Media Team.
              </p>
            </div>
          </ScaleIn>

          <StaggerContainer stagger={0.1} delay={0.4} className="flex gap-2 mb-8">
            {(['all', 'image', 'video'] as const).map((f) => (
              <HoverScale key={f} scale={1.05}>
                <button
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                    filter === f
                      ? 'bg-text-primary text-bg-base border-text-primary'
                      : 'bg-transparent text-text-dimmed border-border-subtle hover:border-text-primary hover:text-text-primary'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Videos'}
                </button>
              </HoverScale>
            ))}
          </StaggerContainer>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border-subtle rounded-2xl">
              <p className="text-text-dimmed text-lg font-jotia">No media available yet.</p>
              <p className="text-text-tertiary text-sm mt-2">Check back during the conference!</p>
            </div>
          ) : (
            <ScrollReveal delay={0.5} from="bottom">
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {filtered.map((item) => (
                  <HoverScale key={item.id} scale={1.02}>
                    <div
                      className="break-inside-avoid bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border-emphasized transition-all cursor-pointer group"
                      onClick={() => setLightbox(item)}
                    >
                      {item.media_type?.startsWith('video') ? (
                        <video
                          src={item.media_url}
                          className="w-full object-cover"
                          muted
                          controls={false}
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.caption || 'Gallery image'}
                          className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      {item.caption && (
                        <div className="p-3">
                          <p className="text-xs text-text-secondary line-clamp-2">{item.caption}</p>
                          <p className="text-[10px] text-text-tertiary mt-2 uppercase tracking-widest">Press Corps</p>
                        </div>
                      )}
                    </div>
                  </HoverScale>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-5xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            {lightbox?.media_type?.startsWith('video') ? (
              <video
                src={lightbox.media_url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <img
                src={lightbox?.media_url}
                alt={lightbox?.caption || 'Gallery image'}
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
              />
            )}
            {lightbox?.caption && (
              <div className="mt-4 text-center">
                <p className="text-white/70 text-sm">{lightbox.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
