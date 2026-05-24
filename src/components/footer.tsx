"use client";

import React from "react";
import Link from "next/link";
import { NxtmunMark, MonoLabel, HRule } from "@/components/nxtmun/primitives";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-base mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">
          {/* Brand */}
          <div className="md:col-span-5">
            <NxtmunMark size="lg" withTagline />
            <p className="mt-6 text-paper-soft text-sm leading-relaxed max-w-sm">
              A student-led Model United Nations conference. Step into the dossier.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <MonoLabel tone="blood">// FIELD OFFICE</MonoLabel>
              <MonoLabel>Dhahran · Saudi Arabia</MonoLabel>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <MonoLabel className="block mb-4">// Sections</MonoLabel>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Dossier" },
                { href: "/gallery", label: "Archive" },
                { href: "/socials", label: "Channels" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-mono text-[12px] uppercase tracking-[0.18em] text-paper-soft hover:text-paper transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <MonoLabel className="block mb-4">// Legal</MonoLabel>
            <ul className="space-y-2.5">
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/acceptable-use", label: "Conduct" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-mono text-[12px] uppercase tracking-[0.18em] text-paper-soft hover:text-paper transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Access */}
          <div className="md:col-span-2">
            <MonoLabel className="block mb-4">// Access</MonoLabel>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/login"
                  className="font-mono text-[12px] uppercase tracking-[0.18em] text-paper hover:text-blood-bright transition-colors"
                >
                  Portal Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="font-mono text-[12px] uppercase tracking-[0.18em] text-paper-soft hover:text-paper transition-colors"
                >
                  Apply
                </Link>
              </li>
              <li>
                <Link
                  href="/login/eb"
                  className="font-mono text-[12px] uppercase tracking-[0.18em] text-paper-mute hover:text-paper transition-colors"
                >
                  Executive
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <HRule className="my-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <MonoLabel>© 2026 NXTMUN · ALL RIGHTS RESERVED</MonoLabel>
          <MonoLabel tone="blood">FILE-NXT-2026 // CONFIDENTIAL</MonoLabel>
        </div>
      </div>
    </footer>
  );
}
