'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-bg-card border border-border-subtle rounded-lg p-10 shadow-lg">
          <div className="flex justify-center mb-8">
            <Image src="/billmun.png" alt="BILLMUN Logo" width={100} height={100} />
          </div>
          <h1 className="font-jotia text-4xl text-text-primary mb-4">Registration Submitted</h1>
          <p className="text-text-secondary mb-8">
            Thank you for registering for the BILLMUN Conference Portal. Your registration is now pending approval.
          </p>
          <Link href="/login" className="px-8 py-3 bg-text-primary text-bg-base rounded-button font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}