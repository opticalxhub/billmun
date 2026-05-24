"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { gsap } from "gsap";
import { displayRole } from "@/lib/roles";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { useConferenceGate } from "@/lib/use-conference-gate";
import { ConferenceLockScreen } from "@/components/conference-lock-screen";
import { LogOut } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────
   Dashboard Hub — BILLMUN corkboard espionage aesthetic
   Full corkboard: pin anchors, string connectors, polaroid-style cards
   ───────────────────────────────────────────────────────────────────── */

type DashCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  label: string;
  rotate: string;
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
      "Submit position papers, join blocs, track the general speakers list, manage your resolution and follow live committee proceedings.",
    href: "/dashboard/delegate",
    label: "MAIN HUB",
    rotate: "-1.2deg",
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
    rotate: "0.8deg",
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
    rotate: "-0.5deg",
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
    rotate: "1.1deg",
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
    rotate: "-0.9deg",
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
    rotate: "0.4deg",
    pinColor: "#c1622a",
    roles: ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"],
    priority: true,
  },
];

export default function DashboardHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

  const boardRef   = useRef<HTMLDivElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);

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

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
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

      // Non-EB roles: route straight to their dashboard
      if (!isEB) {
        if (profileRole === "CHAIR" || profileRole === "CO_CHAIR")     router.push("/dashboard/chair");
        else if (profileRole === "PRESS" || profileRole === "MEDIA")   router.push("/dashboard/press");
        else if (profileRole === "ADMIN")                              router.push("/dashboard/admin");
        else if (profileRole === "SECURITY")                           router.push("/dashboard/security");
        else                                                           router.push("/dashboard/delegate");
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

  /* ── GSAP entrance ───────────────────────────────────────────────── */
  useEffect(() => {
    if (loading || confLoading) return;

    const ctx = gsap.context(() => {
      // Header drops in
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.1 }
      );

      // Cards stagger in with slight bounce
      const cards = boardRef.current?.querySelectorAll(".cork-card");
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.3,
          }
        );
      }
    }, boardRef);

    return () => ctx.revert();
  }, [loading, confLoading]);

  /* ── Early returns ───────────────────────────────────────────────── */
  if (loading || confLoading) return <DashboardLoadingState />;
  if (confLocked && confData) return <ConferenceLockScreen data={confData} />;

  const isGodMode = typeof document !== "undefined" && document.cookie.includes("emergency_expires=");
  const role = ((userProfile?.role as string) ?? "").toUpperCase();
  const isEB = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(role);

  const visibleCards = DASHBOARD_CARDS.filter(
    (c) => isGodMode || c.roles.some((r) => r === role || (isEB && true))
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* ── Corkboard atmosphere (bg) ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 10% 10%, rgba(139,69,19,0.05) 0%, transparent 55%),
              radial-gradient(ellipse at 90% 90%, rgba(160,82,45,0.04) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)
            `,
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ln71YRUCH1P6UVdkaMFhJ890w8Sr4q.png"
            alt="BILLMUN"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            unoptimized
          />
          <div>
            <h1
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--text-primary)",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              BILLMUN
            </h1>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-tertiary)",
                letterSpacing: "0.12em",
                marginTop: "2px",
              }}
            >
              CONFERENCE PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="hidden sm:block text-right">
            <p
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              {(userProfile?.full_name as string) || "User"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-rust)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {displayRole((userProfile?.role as string) ?? "")}
            </p>
          </div>

          <div
            style={{
              width: "1px",
              height: "28px",
              backgroundColor: "var(--border-subtle)",
            }}
          />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 transition-all"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--status-rejected-text)",
              backgroundColor: "var(--status-rejected-bg)",
              border: "1px solid var(--status-rejected-border)",
              borderRadius: "3px",
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* ── Board label ─────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-10 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
            }}
          >
            ACTIVE ASSIGNMENTS
          </div>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "var(--border-subtle)",
            }}
          />
          {/* User profile badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-rust)",
              borderRadius: "3px",
            }}
          >
            <div className="pin-dot" style={{ width: "8px", height: "8px" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-rust)",
                letterSpacing: "0.1em",
              }}
            >
              {((userProfile?.preferred_committee as string) || (userProfile?.role as string) || "PORTAL").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Greeting */}
        <div className="mt-4">
          <h2
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 0.95,
              color: "var(--text-primary)",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
            }}
          >
            {(userProfile?.full_name as string)?.split(" ")[0] ?? "Welcome"}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginTop: "8px",
            }}
          >
            Select your operational station below. All actions are logged.
          </p>
        </div>
      </div>

      {/* ── Corkboard grid ──────────────────────────────────────────── */}
      <main
        ref={boardRef}
        className="relative z-10 px-6 md:px-10 pb-16"
        aria-label="Dashboard selection"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {visibleCards.map((card, i) => (
            <CorkCard
              key={card.id}
              card={card}
              index={i}
              userProfile={userProfile}
            />
          ))}
        </div>

        {/* Profile data strip */}
        <ProfileStrip profile={userProfile} />
      </main>

      {/* ── Monospace footer ────────────────────────────────────────── */}
      <div
        className="relative z-10 px-6 md:px-10 pb-8 flex items-center gap-3"
        style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-disabled)",
            letterSpacing: "0.1em",
          }}
        >
          BILLMUN CONFERENCE PORTAL &bull; AUTHORIZED ACCESS ONLY &bull; ALL ACTIONS AUDITED
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CorkCard — individual pinned card on the board
   ───────────────────────────────────────────────────────────────────── */
function CorkCard({
  card,
  index,
}: {
  card: DashCard;
  index: number;
  userProfile: Record<string, unknown> | null;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -4,
      scale: 1.02,
      duration: 0.25,
      ease: "power2.out",
    });
  };
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const isEB = card.id === "eb";

  return (
    <Link
      ref={cardRef}
      href={card.href}
      className="cork-card relative block group"
      style={{
        transform: `rotate(${card.rotate})`,
        transformOrigin: "center top",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Open ${card.title} dashboard`}
    >
      {/* Pin */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        style={{ animationDelay: `${index * 0.08}s` }}
        aria-hidden
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, #d4602a, ${card.pinColor})`,
            boxShadow: "0 3px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        />
      </div>

      {/* Card body */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: isEB ? "var(--rust-800)" : "var(--paper-aged)",
          border: isEB
            ? "1px solid var(--rust-600)"
            : "1px solid var(--paper-border)",
          boxShadow: "0 6px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
          padding: "24px 22px 20px",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: "2px",
        }}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "160px 160px",
            opacity: 0.04,
            mixBlendMode: "overlay",
          }}
          aria-hidden
        />

        {/* Corner code — mono classification */}
        <div
          className="absolute top-3 right-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            color: isEB ? "var(--rust-200)" : "var(--text-disabled)",
            letterSpacing: "0.1em",
            opacity: 0.6,
          }}
          aria-hidden
        >
          {card.label}
        </div>

        {/* Top section */}
        <div>
          {/* Role title */}
          <h3
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "28px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "0.04em",
              color: isEB ? "var(--rust-200)" : "var(--text-primary)",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {card.title}
          </h3>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: isEB ? "var(--rust-300)" : "var(--text-rust)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            {card.subtitle}
          </p>

          {/* Divider — redaction style */}
          <div
            style={{
              height: "1px",
              backgroundColor: isEB ? "var(--rust-700)" : "var(--border-subtle)",
              marginBottom: "12px",
            }}
          />

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "13px",
              lineHeight: 1.6,
              color: isEB ? "var(--rust-200)" : "var(--text-secondary)",
            }}
          >
            {card.description}
          </p>
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between mt-5 pt-4"
          style={{ borderTop: `1px solid ${isEB ? "var(--rust-700)" : "var(--border-subtle)"}` }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isEB ? "var(--rust-400)" : card.pinColor,
                animation: "pulse-rust 2s ease-in-out infinite",
              }}
              aria-hidden
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: isEB ? "var(--rust-300)" : "var(--text-tertiary)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              ACTIVE
            </span>
          </div>

          <span
            className="group-hover:translate-x-1 transition-transform duration-200"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "10px",
              fontWeight: 700,
              color: isEB ? "var(--rust-300)" : "var(--text-rust)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            ENTER &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ProfileStrip — classified file–style profile card at bottom
   ───────────────────────────────────────────────────────────────────── */
function ProfileStrip({ profile }: { profile: Record<string, unknown> | null }) {
  const fields = [
    { label: "FULL NAME",   value: (profile?.full_name as string) || "—" },
    { label: "ROLE",        value: displayRole((profile?.role as string) ?? "") },
    { label: "COMMITTEE",   value: (profile?.preferred_committee as string) || "UNASSIGNED" },
    { label: "COUNTRY",     value: (profile?.allocated_country as string)  || "UNASSIGNED" },
    { label: "STATUS",      value: (profile?.status as string) || "—" },
    { label: "DIETARY",     value: (profile?.dietary_restrictions as string) || "NONE" },
  ];

  return (
    <div
      className="mt-10 relative"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "2px",
        padding: "20px 24px",
      }}
    >
      {/* Pin top-left */}
      <div className="absolute -top-2 left-8" aria-hidden>
        <div className="pin-dot" style={{ width: "10px", height: "10px" }} />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
          }}
        >
          DELEGATE PROFILE — CONFIDENTIAL
        </span>
        {/* Stamp */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--rust-600)",
            border: "1.5px solid var(--rust-700)",
            padding: "2px 8px",
            transform: "rotate(-2deg)",
            opacity: 0.5,
          }}
          aria-hidden
        >
          APPROVED
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {f.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "14px",
                fontWeight: 600,
                color:
                  f.label === "STATUS"
                    ? "var(--status-approved-text)"
                    : "var(--text-primary)",
                letterSpacing: "0.02em",
              }}
            >
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
