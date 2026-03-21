import React, { useState } from 'react';
import { Card, SectionLabel, Button, Input } from '@/components/ui';

export default function SpeechWorkspace(_props: { user?: any }) {
  void _props;
  const [speech, setSpeech] = useState('');

  return (
    <Card className="col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <SectionLabel className="mb-0">Speech Workspace</SectionLabel>
        <div className="flex gap-2">
           <Button size="sm" variant="outline">Clear</Button>
           <Button size="sm">Save Draft</Button>
        </div>
      </div>
      <div className="pt-4 border-t border-border-subtle space-y-4">
         <Input placeholder="Speech Title (e.g., GSL on Climate Funding)" className="font-bold text-lg border-none bg-bg-raised" />
         <textarea 
           value={speech}
           onChange={(e) => setSpeech(e.target.value)}
           className="w-full h-64 p-4 rounded-card border border-border-subtle bg-bg-base resize-none focus:outline-none focus:ring-2 focus:ring-text-primary leading-relaxed text-text-secondary"
           placeholder="Honorable Chair, distinguished delegates... start typing your speech here."
         />
         <div className="flex justify-between text-xs text-text-tertiary px-2">
           <span>{speech.length} characters</span>
           <span>Est. speaking time: {Math.max(1, Math.round(speech.length / 15))} seconds</span>
         </div>
      </div>
    </Card>
  );
}
