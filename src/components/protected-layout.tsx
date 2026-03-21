import React from 'react';
import { Navigation } from './navigation';
import { Footer } from './footer';

export const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-inter">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};