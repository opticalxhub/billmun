import React from 'react';
import { Card, SectionLabel, Button } from '@/components/ui';

export default function BlocWorkspace() {
  return (
    <Card className="h-full">
      <SectionLabel>Bloc Workspace</SectionLabel>
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <div className="p-4 bg-bg-raised border border-border-subtle rounded text-center">
          <p className="text-text-secondary text-sm mb-4">You are not currently in any working bloc. Join or create one to share directives and working papers.</p>
          <Button variant="outline">Create New Bloc</Button>
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-3">Available Blocs</h3>
          <p className="text-text-disabled text-sm italic">No open blocs in your committee right now.</p>
        </div>
      </div>
    </Card>
  );
}
