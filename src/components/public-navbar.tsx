"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NxtmunMark, MonoLabel } from "@/components/nxtmun/primitives";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dossier", file: "01" },
  { href: "/gallery", label: "Archive", file: "02" },
  { href: "/socials", label: "Channels", file: "03" },
  { href: "/contact", label: "Contact", file: "04" },
  { href: "/login", label: "Portal", file: "05" },
];

export function PublicNavbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/85 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 h-[64px]">
        <div className="flex items-center gap-4">
          <NxtmunMark size="md" />
          <span className="hidden md:inline-block w-px h-5 bg-border-emphasized" aria-hidden />
          <MonoLabel className="hidden md:inline-block">CONFIDENTIAL // 2026</MonoLabel>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-baseline gap-2 px-3 py-2 font-mono uppercase tracking-[0.20em] text-[11px] transition-colors",
                  isActive ? "text-paper" : "text-paper-mute hover:text-paper"
                )}
              >
                <span className="text-blood-bright/70 text-[9px]">{link.file}</span>
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-px left-3 right-3 h-px bg-paper" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>

        <button
          className="sm:hidden p-2 text-paper border border-border-subtle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {mobileMenu && (
        <div className="sm:hidden border-t border-border-subtle bg-bg-base">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenu(false)}
                className="flex items-baseline gap-3 py-3 px-2 font-mono uppercase tracking-[0.20em] text-[11px] text-paper-soft hover:text-paper border-b border-border-subtle/50 last:border-b-0"
              >
                <span className="text-blood-bright/70 text-[9px]">{link.file}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
