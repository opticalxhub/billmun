"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/footer";
import { PublicNavbar } from "@/components/public-navbar";
import {
  NxtmunMark,
  MonoLabel,
  StampBadge,
  ClassifiedCard,
  HRule,
  StringPin,
  NoiseOverlay,
} from "@/components/nxtmun/primitives";
import { cn } from "@/lib/utils";

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  media_type: string | null;
  status: string | null;
};

const COMMITTEES = [
  { code: "01", name: "UNHRC", topic: "Human Rights Council" },
  { code: "02", name: "UNICEF", topic: "Children's Emergency Fund" },
  { code: "03", name: "WHO", topic: "World Health Organization" },
  { code: "04", name: "ICC", topic: "International Criminal Court" },
  { code: "05", name: "ECW", topic: "Education Cannot Wait" },
  { code: "06", name: "SPECPOL", topic: "Special Political & Decolonization" },
  { code: "07", name: "CRISIS", topic: "Continuous Crisis Committee" },
];

const PILLARS = [
  {
    code: "B",
    word: "Build",
    note: "Every delegate has the opportunity to grow. Every paper passes through review.",
  },
  {
    code: "I",
    word: "Inspire",
    note: "A professional environment in every committee room. The standard is the file.",
  },
  {
    code: "L",
    word: "Lead",
    note: "New ideas, new leaders, new perspectives. Decisions move the dossier forward.",
  },
];

export default function LandingPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setGallery(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (gallery.length <= 1 || playingVideo) return;
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((p) => (p + 1) % gallery.length);
    }, 5500);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [gallery.length, playingVideo]);

  const goToPrev = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex((p) => (p - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const goToNext = useCallback(() => {
    setPlayingVideo(null);
    setActiveIndex((p) => (p + 1) % gallery.length);
  }, [gallery.length]);

  const visibleItems = useMemo(() => {
    if (gallery.length === 0) return [];
    const count = Math.min(gallery.length, 5);
    const half = Math.floor(count / 2);
    const items: { item: GalleryItem; position: number; isActive: boolean }[] = [];
    const used = new Set<string>();
    for (let i = -half; i <= half; i++) {
      if (items.length >= count) break;
      const idx = (activeIndex + i + gallery.length) % gallery.length;
      const it = gallery[idx];
      if (used.has(it.id)) continue;
      used.add(it.id);
      items.push({ item: it, position: i, isActive: i === 0 });
    }
    return items;
  }, [gallery, activeIndex]);

  return (
    <div className="min-h-screen bg-bg-base text-paper flex flex-col relative overflow-x-hidden">
      <NoiseOverlay intensity="default" />
      <PublicNavbar />

      {/* ============= HERO ============= */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 sm:px-10 overflow-hidden">
        {/* Decorative cartography vignette */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--nxt-paper) 0, transparent 35%), radial-gradient(circle at 80% 70%, var(--nxt-blood) 0, transparent 30%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          {/* Top file metadata strip */}
          <div className="flex items-center gap-4 flex-wrap mb-10">
            <StampBadge variant="blood">CLASSIFIED</StampBadge>
            <span className="w-px h-4 bg-border-emphasized" aria-hidden />
            <MonoLabel>FILE-NXT-2026 // EDITION I</MonoLabel>
            <span className="hidden sm:inline-block w-px h-4 bg-border-emphasized" aria-hidden />
            <MonoLabel className="hidden sm:inline-block">03–04 APR · DHAHRAN, SA</MonoLabel>
          </div>

          {/* Headline grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display font-semibold leading-[0.92] tracking-tight text-balance">
                <span className="block text-[14vw] sm:text-[10vw] lg:text-[8.5vw] xl:text-[7.5vw]">
                  Step into
                </span>
                <span className="block text-[14vw] sm:text-[10vw] lg:text-[8.5vw] xl:text-[7.5vw] text-blood-bright italic">
                  the dossier.
                </span>
              </h1>

              <div className="mt-8 max-w-xl">
                <p className="text-paper-soft text-base sm:text-lg leading-relaxed">
                  NXTMUN is a student-led Model United Nations conference. Apply, debate, and
                  decide. Every committee room is a confidential file — every delegate, an
                  investigator on the record.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-3 px-6 py-3.5 bg-blood text-paper font-mono uppercase tracking-[0.22em] text-[11px] font-bold border border-blood-deep hover:bg-blood-bright transition-colors"
                >
                  <span>Apply for Edition I</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-border-emphasized text-paper font-mono uppercase tracking-[0.22em] text-[11px] font-medium hover:border-paper hover:bg-bg-card transition-colors"
                >
                  Enter Portal
                </Link>
              </div>

              <div className="mt-6">
                <MonoLabel>By Alaa Abbadi & Kenan Nezar — Founding Officers</MonoLabel>
              </div>
            </div>

            {/* Side dossier card */}
            <div className="lg:col-span-4 hidden lg:block">
              <ClassifiedCard
                label="// CONFERENCE BRIEF"
                stamp="EDITION I"
                tilt="right"
                className="p-6"
              >
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-display text-5xl text-paper">04</span>
                  <div>
                    <MonoLabel tone="paper">DAYS</MonoLabel>
                    <p className="font-mono text-[11px] text-paper-mute mt-0.5">03–04 APR 2026</p>
                  </div>
                </div>
                <HRule className="my-4" />
                <ul className="space-y-3 font-mono text-[12px] text-paper-soft">
                  <li className="flex justify-between gap-3">
                    <span className="text-paper-mute">VENUE</span>
                    <span className="text-right">Yarmook Elementary, Dhahran</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-paper-mute">DEPT.</span>
                    <span className="text-right">{COMMITTEES.length} Committees</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-paper-mute">CLEARANCE</span>
                    <span className="text-right text-blood-bright">CONFIDENTIAL</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-paper-mute">STATUS</span>
                    <span className="text-right">Recruiting</span>
                  </li>
                </ul>
                <HRule className="my-4" />
                <Link
                  href="/register"
                  className="flex items-center justify-between font-mono uppercase tracking-[0.20em] text-[10px] text-paper hover:text-blood-bright transition-colors"
                >
                  <span>Open File →</span>
                  <span className="text-blood-bright/70">REF: NXT-26-01</span>
                </Link>
              </ClassifiedCard>
            </div>
          </div>
        </div>
      </section>

      {/* ============= GALLERY CAROUSEL — "FIELD PHOTOGRAPHS" ============= */}
      <section className="relative py-16 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div>
              <MonoLabel tone="blood" className="mb-3 block">// EXHIBIT A</MonoLabel>
              <h2 className="font-display text-3xl md:text-5xl">Field photographs.</h2>
            </div>
            <Link
              href="/gallery"
              className="font-mono uppercase tracking-[0.22em] text-[11px] text-paper hover:text-blood-bright transition-colors flex items-center gap-2"
            >
              View archive <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {mounted && gallery.length > 0 ? (
            <div className="relative">
              {gallery.length > 1 && (
                <button
                  onClick={goToPrev}
                  aria-label="Previous photograph"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 bg-bg-card border border-border-emphasized text-paper hover:bg-bg-hover hover:border-paper transition-all -translate-x-1/2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-stretch justify-center gap-3 overflow-hidden">
                {visibleItems.map(({ item, position, isActive }) => (
                  <div
                    key={`${item.id}-${position}`}
                    onClick={() =>
                      !isActive &&
                      setActiveIndex((activeIndex + position + gallery.length) % gallery.length)
                    }
                    className={cn(
                      "relative transition-all duration-500 cursor-pointer overflow-hidden flex-shrink-0 border bg-bg-card",
                      isActive
                        ? "w-[60%] sm:w-[44%] aspect-[4/3] z-10 border-paper/40 shadow-dossier"
                        : "w-[18%] sm:w-[16%] aspect-[4/3] opacity-30 grayscale hover:opacity-60 border-border-subtle"
                    )}
                  >
                    {item.media_type?.startsWith("video") ? (
                      <div className="relative w-full h-full bg-black">
                        <video
                          key={`v-${item.id}`}
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
                            <div className="w-14 h-14 rounded-full bg-paper flex items-center justify-center hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-ink ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={item.media_url || "/placeholder.svg"}
                        alt={item.caption || "Field photograph"}
                        className="w-full h-full object-cover"
                        loading={isActive ? "eager" : "lazy"}
                      />
                    )}

                    {/* Tape corners on active */}
                    {isActive && (
                      <>
                        <span
                          aria-hidden
                          className="absolute -top-2 left-6 w-12 h-4 bg-paper/15 border-x border-paper/30 rotate-[-3deg]"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/95 via-ink/60 to-transparent p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-[11px] text-paper-soft truncate flex-1">
                              {item.caption || "Untitled exhibit."}
                            </p>
                            <MonoLabel>
                              EX-{String(activeIndex + 1).padStart(3, "0")}
                            </MonoLabel>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {gallery.length > 1 && (
                <button
                  onClick={goToNext}
                  aria-label="Next photograph"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 bg-bg-card border border-border-emphasized text-paper hover:bg-bg-hover hover:border-paper transition-all translate-x-1/2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {gallery.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Go to photograph ${i + 1}`}
                      className={cn(
                        "h-px transition-all",
                        i === activeIndex ? "w-12 bg-paper" : "w-6 bg-border-emphasized hover:bg-paper-mute"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-border-emphasized py-20 text-center">
              <MonoLabel>// NO EXHIBITS ON FILE</MonoLabel>
              <p className="font-mono text-[12px] text-paper-mute mt-2">
                Field photographs will appear here during the conference.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============= ABOUT — DOSSIER OPENS ============= */}
      <section id="about" className="relative py-24 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-4">
            <MonoLabel tone="blood" className="mb-3 block">// CASE FILE 001</MonoLabel>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05]">
              Build.<br />
              <span className="italic">Inspire.</span><br />
              Lead.
            </h2>
            <div className="mt-6">
              <StringPin />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <p className="font-mono text-[14px] leading-[1.75] text-paper-soft max-w-2xl">
              <span className="text-paper font-semibold">NXTMUN</span> is a student-led Model
              United Nations initiative built around three principles. They are not slogans. They
              are how every committee room operates and how every delegate is held to account.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
              {PILLARS.map((p) => (
                <div key={p.code} className="bg-bg-base p-6">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-5xl text-blood-bright">{p.code}</span>
                    <span className="font-display text-2xl text-paper">{p.word}</span>
                  </div>
                  <p className="font-mono text-[12px] text-paper-soft leading-[1.7]">{p.note}</p>
                </div>
              ))}
            </div>

            <div>
              <MonoLabel className="mb-4 block">// EDITION I — STATEMENT</MonoLabel>
              <p className="font-mono text-[13px] leading-[1.75] text-paper-soft max-w-2xl">
                Edition I, scheduled for{" "}
                <span className="text-paper font-semibold">3–4 April 2026</span>, marks the
                official launch of the conference. This first edition is the foundation upon
                which every future NXTMUN initiative will be built. With an emphasis on clarity,
                organization, and academic depth, Edition I is designed not only to meet
                expectations, but to set a new benchmark for student-led conferences in the
                region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============= COMMITTEES — INDEX OF FILES ============= */}
      <section className="relative py-24 px-6 sm:px-10 border-t border-border-subtle bg-bg-card/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
            <div>
              <MonoLabel tone="blood" className="mb-3 block">// EXHIBIT B</MonoLabel>
              <h2 className="font-display text-4xl md:text-5xl">Index of files.</h2>
              <p className="font-mono text-[13px] text-paper-soft mt-3 max-w-md">
                Seven committees on the docket for Edition I.
              </p>
            </div>
            <Link
              href="/committees"
              className="font-mono uppercase tracking-[0.22em] text-[11px] text-paper hover:text-blood-bright transition-colors flex items-center gap-2"
            >
              Read full briefs <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border-t border-border-subtle">
            {COMMITTEES.map((c, i) => (
              <Link
                key={c.code}
                href="/committees"
                className="group grid grid-cols-12 items-center gap-4 py-6 border-b border-border-subtle hover:bg-bg-card transition-colors"
              >
                <span className="col-span-1 font-mono text-[10px] text-paper-mute tracking-[0.18em]">
                  {c.code}
                </span>
                <span className="col-span-3 sm:col-span-2 font-display text-2xl sm:text-3xl text-paper group-hover:text-blood-bright transition-colors">
                  {c.name}
                </span>
                <span className="col-span-7 sm:col-span-8 font-mono text-[12px] sm:text-[13px] text-paper-soft">
                  {c.topic}
                </span>
                <span className="col-span-1 text-right text-paper-mute group-hover:text-paper transition-colors">
                  <ArrowUpRight className="w-4 h-4 inline-block" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============= MEET THE TEAM ============= */}
      <section className="relative py-24 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <MonoLabel tone="blood" className="mb-3 block">// PERSONNEL FILE</MonoLabel>
            <h2 className="font-display text-4xl md:text-5xl">Meet the executive board.</h2>
            <p className="font-mono text-[13px] text-paper-soft mt-3 max-w-md mx-auto">
              The officers behind the dossier.
            </p>
          </div>

          <ClassifiedCard label="// VIDEO BRIEF" className="overflow-hidden">
            <div className="relative bg-ink">
              <video
                key="team-video"
                src="/billeb.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto max-h-[70vh]"
                style={{ display: "block" }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </ClassifiedCard>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section className="relative py-24 px-6 sm:px-10 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <MonoLabel tone="blood" className="mb-4 block">// FILE STATUS: OPEN</MonoLabel>
          <h2 className="font-display text-4xl md:text-6xl text-balance">
            The investigation begins <span className="italic text-blood-bright">3 April</span>.
          </h2>
          <p className="font-mono text-[13px] text-paper-soft mt-6 max-w-lg mx-auto">
            Apply now to secure your seat at Edition I. Applications are reviewed in the order
            received.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-blood text-paper font-mono uppercase tracking-[0.22em] text-[12px] font-bold border border-blood-deep hover:bg-blood-bright transition-colors"
            >
              <span>Apply Now</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border-emphasized text-paper font-mono uppercase tracking-[0.22em] text-[12px] font-medium hover:border-paper hover:bg-bg-card transition-colors"
            >
              Contact Officers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
