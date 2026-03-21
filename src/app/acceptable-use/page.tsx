'use client';

import React from 'react';
import { Footer } from '@/components/footer';

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <div className="max-w-4xl mx-auto py-20 px-8">
        <h1 className="font-jotia text-5xl mb-8">Acceptable Use Policy</h1>
        <div className="space-y-4 text-text-secondary">
          <p>This acceptable use policy covers the products, services, and technologies (collectively referred to as the “Products”) provided by BILLMUN under any ongoing agreement. It’s designed to protect us, our customers, and the general Internet community from unethical, irresponsible, and illegal activity.</p>
          <p>BILLMUN customers found engaging in activities prohibited by this acceptable use policy may be liable for service suspension and account termination. In extreme cases, we may be legally obligated to report such customers to the relevant authorities.</p>
          <p>This policy was last reviewed on 20 March 2026.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}