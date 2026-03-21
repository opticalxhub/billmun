import React from 'react';
import { Card, SectionLabel, Input } from '@/components/ui';

export default function CountryResearch(_props: { user?: any; committeeAssignment?: any }) {
  void _props;
  return (
    <Card className="h-full">
      <SectionLabel>Country Profile & Research</SectionLabel>
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <Input placeholder="Search global policy databases..." className="mb-4" />
        <div className="p-4 bg-bg-base border border-border-subtle rounded-card space-y-2">
           <p className="text-sm text-text-secondary line-clamp-3">
             Your allocated country research data will appear here. For now, you can cross-reference UN treaties manually using the global search system or ask the AI engine to generate a summary of your foreign policy stance.
           </p>
        </div>
      </div>
    </Card>
  );
}
