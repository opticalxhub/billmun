"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { displayRole } from "@/lib/roles";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { useConferenceGate } from "@/lib/use-conference-gate";
import { ConferenceLockScreen } from "@/components/conference-lock-screen";
import { LogOut } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────
   Dashboard Hub — NXTMUN Corkboard
   Full corkboard: asymmetric polaroid cards, rust pins, SVG string connectors
   One dominant element: the NXTMUN wordmark. Cards breathe.
   ───────────────────────────────────────────────────────────────────── */

type DashCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  label: string;
  rotate: number;
  pinColor: string;
  roles: string[];
  priority?: boolean;
};

const DASHBOARD_CARDS: DashCard[] = [
  {
    id: "delegate",
    title: "DELEGATE",
    subtitle: "Personal Briefing Room",
    description:
      "Submit position papers, join blocs, track the speakers list, manage your resolution and follow live committee proceedings.",
    href: "/dashboard/delegate",
    label: "MAIN HUB",
    rotate: -1.4,
    pinColor: "#c1622a",
    roles: ["DELEGATE", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
    priority: true,
  },
  {
    id: "chair",
    title: "CHAIR",
    subtitle: "Committee Control",
    description:
      "Lead debates, manage the speakers list, run voting sessions, broadcast announcements and oversee committee minutes in real time.",
    href: "/dashboard/chair",
    label: "COMMITTEE LEAD",
    rotate: 0.9,
    pinColor: "#a0522d",
    roles: ["CHAIR", "CO_CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
  },
  {
    id: "press",
    title: "PRESS",
    subtitle: "Media Operations",
    description:
      "Write and submit press releases, photograph proceedings, track editorial deadlines and manage interview access.",
    href: "/dashboard/press",
    label: "MEDIA",
    rotate: -0.6,
    pinColor: "#8b7355",
    roles: ["PRESS", "MEDIA", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
  },
  {
    id: "security",
    title: "SECURITY",
    subtitle: "Ground Operations",
    description:
      "Delegate check-in, credential lookup, incident reporting, real-time venue status and direct comms with EB.",
    href: "/dashboard/security",
    label: "SAFETY",
    rotate: 1.2,
    pinColor: "#7a3d16",
    roles: ["SECURITY", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
  },
  {
    id: "admin",
    title: "ADMIN",
    subtitle: "Logistics Control",
    description:
      "Manage delegates, committees, staff accounts, credentials, payment tracking and conference operations.",
    href: "/dashboard/admin",
    label: "OPERATIONS",
    rotate: -0.8,
    pinColor: "#9a5020",
    roles: ["ADMIN", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
  },
  {
    id: "eb",
    title: "EXECUTIVE BOARD",
    subtitle: "Strategic Oversight",
    description:
      "Full multi-committee visibility, award management, crisis oversight, conference milestone tracking and EB-wide communications.",
    href: "/eb/dash",
    label: "SYSTEM ADMIN",
    rotate: 0.5,
    pinColor: "#c1622a",
    roles: ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
    priority: true,
  },
];

export default function DashboardHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

  /* ── Auth ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const checkUser = async () => {
      if (typeof document !== "undefined" && document.cookie.includes("emergency_expires=")) {
        setUserProfile({
          id: "00000000-0000-0000-0000-000000000000",
          role: "EXECUTIVE_BOARD",
          full_name: "Engineer (Emergency)",
          status: "APPROVED",
        });
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const authUserId = authUser?.id ?? null;
      if (!authUserId) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("id, email, full_name, role, status, dietary_restrictions, preferred_committee, allocated_country")
        .eq("id", authUserId)
        .maybeSingle();

      if (!profile) { router.push("/login"); return; }

      const profileRole = (profile as { role?: string }).role ?? "";
      const profileStatus = (profile as { status?: string }).status ?? "";
      const isEB = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(profileRole);

      if (profileStatus !== "APPROVED" && !isEB) {
        if (profileStatus === "PENDING") router.push("/pending");
        else router.push("/rejected");
        return;
      }

      if (!isEB) {
        if (profileRole === "CHAIR" || profileRole === "CO_CHAIR")   router.push("/dashboard/chair");
        else if (profileRole === "PRESS" || profileRole === "MEDIA") router.push("/dashboard/press");
        else if (profileRole === "ADMIN")                            router.push("/dashboard/admin");
        else if (profileRole === "SECURITY")                         router.push("/dashboard/security");
        else                                                         router.push("/dashboard/delegate");
        return;
      }

      setUserProfile(profile as Record<string, unknown>);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  /* ── Conference gate ─────────────────────────────────────────────── */
  const { data: confData, isLocked: confLocked, isLoading: confLoading } = useConferenceGate(
    (userProfile?.role as string) ?? null
  );

  if (loading || confLoading) return <DashboardLoadingState />;
  if (confLocked && confData) return <ConferenceLockScreen data={confData} />;

  const isGodMode = typeof document !== "undefined" && document.cookie.includes("emergency_expires=");
  const role = ((userProfile?.role as string) ?? "").toUpperCase();
  const isEB = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(role);

  const visibleCards = DASHBOARD_CARDS.filter(
    c => isGodMode || c.roles.some(r => r === role || (isEB && true))
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* ── Ambient radial bg ────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse at 8% 12%, rgba(139,69,19,0.045) 0%, transparent 50%),
            radial-gradient(ellipse at 92% 88%, rgba(160,82,45,0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(10, 9, 7, 0.97)" }}
      >
        <Link href="/" className="flex items-center gap-3" aria-label="NXTMUN home">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ln71YRUCH1P6UVdkaMFhJ890w8Sr4q.png"
            alt=""
            width={26}
            height={26}
            className="w-6.5 h-6.5 object-contain opacity-85"
            unoptimized
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            NXTMUN
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.04em",
              }}
            >
              {(userProfile?.full_name as string) || "User"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-rust)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              {displayRole((userProfile?.role as string) ?? "")}
            </p>
          </div>

          <div style={{ width: "1px", height: "26px", backgroundColor: "var(--border-subtle)" }} />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 h-8 transition-all active:scale-[0.97]"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--status-rejected-text)",
              backgroundColor: "var(--status-rejected-bg)",
              border: "1px solid var(--status-rejected-border)",
              borderRadius: "2px",
            }}
            aria-label="Log out"
          >
            <LogOut className="w-3 h-3" aria-hidden />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* ── Board intro ─────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-10 pt-12 pb-6">
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-rust)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Active Assignments
        </p>
        <h2
          className="font-condensed uppercase"
          style={{
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          {(userProfile?.full_name as string)?.split(" ")[0] ?? "Welcome"}
        </h2>
        <p
          className="mt-3"
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "14px",
            color: "var(--text-tertiary)",
            maxWidth: "400px",
            lineHeight: 1.6,
          }}
        >
          Select your operational station. All actions are logged.
        </p>
      </div>

      {/* ── Corkboard ───────────────────────────────────────────────── */}
      <CorkBoard cards={visibleCards} />

      {/* ── Footer strip ───────────────────────────────────────────── */}
      <div
        className="relative z-10 px-6 md:px-10 py-5 mt-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-disabled)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          NXTMUN Conference Portal &bull; Authorized Access Only &bull; All Actions Audited
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CorkBoard — SVG string connectors between pinned cards
   ───────────────────────────────────────────────────────────────────── */
function CorkBoard({ cards }: { cards: DashCard[] }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      ref={boardRef}
      className="relative z-10 px-6 md:px-10 pb-16 pt-4"
      aria-label="Dashboard selection"
    >
      {/* SVG strings drawn between card pin centers */}
      {mounted && (
        <StringConnectors boardRef={boardRef} cardRefs={cardRefs} count={cards.length} />
      )}

      {/* Asymmetric grid: 2 columns on md, 3 on lg */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
        style={{ perspective: "1200px" }}
      >
        {cards.map((card, i) => (
          <CorkCard
            key={card.id}
            card={card}
            index={i}
            ref={el => { cardRefs.current[i] = el; }}
          />
        ))}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   StringConnectors — SVG red-string network above cards
   ───────────────────────────────────────────────────────────────────── */
function StringConnectors({
  boardRef,
  cardRefs,
  count,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  cardRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  count: number;
}) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  useEffect(() => {
    const compute = () => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      const pts: { x: number; y: number }[] = [];

      cardRefs.current.forEach(el => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        pts.push({
          x: r.left - boardRect.left + r.width / 2,
          y: r.top - boardRect.top + 4, // pin top
        });
      });

      // Connect cards sequentially with some skips for visual tension
      const newLines: typeof lines = [];
      for (let i = 0; i < pts.length - 1; i++) {
        newLines.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y });
        // Skip-one connector for visual interest
        if (i + 2 < pts.length && i % 2 === 0) {
          newLines.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i + 2].x, y2: pts[i + 2].y });
        }
      }
      setLines(newLines);
    };

    const t = setTimeout(compute, 120);
    window.addEventListener("resize", compute, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("resize", compute); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <defs>
        <filter id="string-blur">
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="rgba(160, 100, 55, 0.22)"
          strokeWidth="0.8"
          filter="url(#string-blur)"
          style={{
            strokeDasharray: "1000",
            strokeDashoffset: "1000",
            animation: `string-draw 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i * 0.1}s forwards`,
          }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CorkCard — aged paper polaroid pinned to board
   ───────────────────────────────────────────────────────────────────── */
import React from "react";

const CorkCard = React.forwardRef<HTMLAnchorElement, { card: DashCard; index: number }>(
  function CorkCard({ card, index }, ref) {
    const isEB = card.id === "eb";

    return (
      <Link
        ref={ref}
        href={card.href}
        className="relative block group"
        style={{
          transform: `rotate(${card.rotate}deg)`,
          transformOrigin: "50% 0",
          animation: `card-reveal 450ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.07 + 0.2}s both`,
          zIndex: 1,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.transform = `rotate(${card.rotate * 0.3}deg) translateY(-6px) scale(1.025)`;
          el.style.zIndex = "10";
          el.style.transition = "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.transform = `rotate(${card.rotate}deg) translateY(0) scale(1)`;
          el.style.zIndex = "1";
          el.style.transition = "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)";
        }}
        aria-label={`Open ${card.title} dashboard`}
      >
        {/* Pin */}
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10"
          aria-hidden
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 33% 33%, #d4602a, ${card.pinColor})`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)",
              animation: `pin-drop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.07 + 0.15}s both`,
            }}
          />
        </div>

        {/* Card body */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: isEB ? "var(--rust-900)" : "var(--paper-aged)",
            border: `1px solid ${isEB ? "var(--rust-700)" : "var(--paper-border)"}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.5)",
            padding: "28px 24px 22px",
            minHeight: "220px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "2px",
          }}
        >
          {/* Subtle paper grain */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
              opacity: 0.035,
              mixBlendMode: "overlay",
            }}
          />

          {/* Corner label */}
          <div
            className="absolute top-3 right-3"
            aria-hidden
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: isEB ? "var(--rust-300)" : "var(--text-disabled)",
              letterSpacing: "0.1em",
              opacity: 0.7,
              textTransform: "uppercase",
            }}
          >
            {card.label}
          </div>

          {/* Content */}
          <div>
            <h3
              className="font-condensed uppercase"
              style={{
                fontSize: "26px",
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: "0.02em",
                color: isEB ? "var(--rust-200)" : "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: isEB ? "var(--rust-300)" : "var(--text-rust)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              {card.subtitle}
            </p>
            <div
              style={{
                height: "1px",
                backgroundColor: isEB ? "var(--rust-800)" : "var(--border-subtle)",
                marginBottom: "14px",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                lineHeight: 1.65,
                color: isEB ? "var(--rust-200)" : "var(--text-secondary)",
              }}
            >
              {card.description}
            </p>
          </div>

          {/* Arrow */}
          <div
            className="mt-5 flex items-center justify-between"
          >
            <span
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: isEB ? "var(--rust-300)" : "var(--text-rust)",
                opacity: 0,
                transform: "translateX(-6px)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }}
              className="group-hover:!opacity-100 group-hover:!translate-x-0"
            >
              Enter &rarr;
            </span>
          </div>
        </div>
      </Link>
    );
  }
);
