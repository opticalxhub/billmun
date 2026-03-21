'use client';

import React from 'react';
import { Footer } from '@/components/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <div className="max-w-4xl mx-auto py-20 px-8">
        <h1 className="font-jotia text-5xl mb-8" role="main">Terms of Service</h1>
        <div className="space-y-4 text-text-secondary">
          <p className="text-text-secondary leading-relaxed mb-4">
            Welcome to BILLMUN. By accessing our conference portal, you agree to be bound by these Terms of Service.
          </p>
          <h2 className="font-jotia text-xl text-text-primary mb-4 mt-8">1. Acceptance of Terms</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            By registering for and participating in BILLMUN, you agree to comply with all conference rules,
              the instructions of the Executive Board, and these terms.
            </p>
            <h2 className="font-jotia text-xl text-text-primary mb-4 mt-8">2. Code of Conduct</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Delegates are expected to maintain professional decorum at all times. Harassment, discrimination,
              or disruptive behavior will not be tolerated and may result in immediate dismissal from the conference.
            </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}