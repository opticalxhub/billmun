import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-card py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-text-tertiary">
          &copy; {new Date().getFullYear()} BILLMUN. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
