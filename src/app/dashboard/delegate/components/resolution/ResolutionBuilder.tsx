import React from 'react';
import { Card, SectionLabel, Button } from '@/components/ui';

export default function ResolutionBuilder(_props: { user?: any; committeeAssignment?: any }) {
  void _props;
  return (
    <Card className="col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <SectionLabel className="mb-0">Resolution Builder</SectionLabel>
        <Button size="sm">New Draft</Button>
      </div>
      <div className="pt-4 border-t border-border-subtle min-h-[300px] flex items-center justify-center bg-bg-raised border border-border-subtle rounded-card">
         <div className="text-center">
            <span className="inline-block p-4 rounded-full bg-bg-card border border-border-subtle mb-4"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3v4a1 1 0 001 1h4M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <p className="text-text-primary font-medium mb-1">Start drafting</p>
            <p className="text-text-disabled text-sm">Upload a current working paper or start writing preamble clauses.</p>
         </div>
      </div>
    </Card>
  );
}
