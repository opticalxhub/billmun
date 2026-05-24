/**
 * NXTMUN — shared visual primitives.
 * Investigative-noir aesthetic: aged paper text, blood red accent, near-black ink.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ---------------- NxtmunMark — wordmark / logo lockup ---------------- */
type MarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  withTagline?: boolean;
  asLink?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { wordmark: "text-base", tag: "text-[8px]" },
  md: { wordmark: "text-xl", tag: "text-[9px]" },
  lg: { wordmark: "text-3xl md:text-4xl", tag: "text-[10px]" },
  xl: { wordmark: "text-5xl md:text-7xl", tag: "text-[11px]" },
};

export function NxtmunMark({ size = "md", withTagline = false, asLink = true, className }: MarkProps) {
  const s = sizeMap[size];
  const inner = (
    <span className={cn("inline-flex flex-col items-start leading-none", className)}>
      {withTagline && (
        <span
          className={cn(
            "stamp-label mb-1 flex items-center gap-2",
            s.tag
          )}
          aria-hidden
        >
          <span className="inline-block h-px w-4 bg-blood" />
          CLASSIFIED // 2026
        </span>
      )}
      <span
        className={cn(
          "font-display font-semibold tracking-[0.02em] text-paper",
          s.wordmark
        )}
      >
        NXTMUN
      </span>
    </span>
  );

  if (asLink) {
    return (
      <Link href="/" aria-label="NXTMUN — home" className="inline-block focus:outline-none">
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ---------------- MonoLabel — small caps, wide-tracked technical caption ---------------- */
export function MonoLabel({
  children,
  className,
  tone = "mute",
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "mute" | "paper" | "blood";
  as?: React.ElementType;
}) {
  const toneClass =
    tone === "blood"
      ? "text-blood-bright"
      : tone === "paper"
        ? "text-paper"
        : "text-paper-mute";
  return (
    <Tag
      className={cn(
        "font-mono uppercase tracking-[0.20em] text-[10px] font-medium",
        toneClass,
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* ---------------- StampBadge — corner stamp / status chip ---------------- */
export function StampBadge({
  children,
  variant = "blood",
  className,
}: {
  children: React.ReactNode;
  variant?: "blood" | "paper" | "ghost";
  className?: string;
}) {
  const styles =
    variant === "paper"
      ? "border-paper/60 text-paper"
      : variant === "ghost"
        ? "border-paper-faint text-paper-mute"
        : "border-blood-deep text-blood-bright";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono uppercase tracking-[0.22em] text-[9px] font-bold",
        styles,
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block w-1 h-1 rounded-full",
          variant === "blood" ? "bg-blood-bright" : variant === "paper" ? "bg-paper" : "bg-paper-mute"
        )}
      />
      {children}
    </span>
  );
}

/* ---------------- ClassifiedCard — dossier-styled surface ---------------- */
export function ClassifiedCard({
  children,
  className,
  label,
  stamp,
  tilt,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  stamp?: string;
  tilt?: "none" | "left" | "right";
}) {
  const tiltClass = tilt === "left" ? "-rotate-[0.4deg]" : tilt === "right" ? "rotate-[0.4deg]" : "";
  return (
    <div
      className={cn(
        "relative nxt-paper-card border border-border-subtle shadow-dossier",
        tiltClass,
        className
      )}
    >
      {label && (
        <div className="absolute -top-2 left-4 px-2 bg-bg-base">
          <MonoLabel tone="mute">{label}</MonoLabel>
        </div>
      )}
      {stamp && (
        <div className="absolute top-3 right-3">
          <StampBadge>{stamp}</StampBadge>
        </div>
      )}
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute inset-0 nxt-grain" aria-hidden />
    </div>
  );
}

/* ---------------- NoiseOverlay — film grain layer ---------------- */
export function NoiseOverlay({
  intensity = "default",
  className,
}: {
  intensity?: "subtle" | "default" | "heavy";
  className?: string;
}) {
  const opacity =
    intensity === "subtle" ? "opacity-[0.04]" : intensity === "heavy" ? "opacity-[0.10]" : "opacity-[0.06]";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[1] nxt-grain", opacity, className)}
    />
  );
}

/* ---------------- ScanlineOverlay — subtle CRT lines (toggleable) ---------------- */
export function ScanlineOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[1] nxt-scanlines", className)}
    />
  );
}

/* ---------------- Redacted — black-bar redacted text ---------------- */
export function Redacted({ width = "auto", children }: { width?: string | number; children?: React.ReactNode }) {
  return (
    <span
      className="redacted inline-block align-middle h-[1em]"
      style={{ width: typeof width === "number" ? `${width}px` : width }}
      aria-label="redacted"
    >
      {children ?? "\u00A0"}
    </span>
  );
}

/* ---------------- HRule — horizontal hairline ---------------- */
export function HRule({ className }: { className?: string }) {
  return <div className={cn("nxt-rule", className)} aria-hidden />;
}

/* ---------------- StringPin — decorative red string corner ---------------- */
export function StringPin({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blood-bright shadow-[0_0_0_1px_var(--nxt-blood-deep)]" />
      <span className="inline-block w-8 h-px bg-blood/70" />
    </span>
  );
}
