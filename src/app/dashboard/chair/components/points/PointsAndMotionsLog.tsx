'use client';

import React, { useState, useEffect } from 'react';
import { Card, SectionLabel } from '@/components/ui';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase';

const MOTION_TYPES = [
  'Point of Order',
  'Point of Information',
  'Point of Personal Privilege',
  'Motion to Open Debate',
  'Motion to Close Debate',
  'Motion to Table Agenda',
  'Motion to Introduce a Working Paper',
  'Motion to Move into Voting Procedure',
  'Motion to Suspend the Meeting',
  'Motion to Adjourn the Meeting',
  'Motion for an Unmoderated Caucus',
  'Motion for a Moderated Caucus'
];

export function PointsAndMotionsLog({ committee, setSessionState }: { committee: any, setSessionState: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  
  const [newType, setNewType] = useState(MOTION_TYPES[0]);
  const [newDelegate, setNewDelegate] = useState('');
  const [newOutcome, setNewOutcome] = useState('Passed');

  useEffect(() => {
    if (committee?.id) {
      fetchLogs();
      fetchDelegates();
    }
  }, [committee?.id]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('points_and_motions')
      .select('*, users(full_name)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false });
    
    if (data) setLogs(data);
  };

  const fetchDelegates = async () => {
    const { data } = await supabase
      .from('committee_assignments')
      .select('users(id, full_name)')
      .eq('committee_id', committee.id);
      
    if (data) {
      setDelegates(data.map((d: any) => d.users).filter(Boolean));
    }
  };

  const handleLogMotion = async () => {
    if (!newType) return;

    const { data, error } = await supabase
      .from('points_and_motions')
      .insert([{
        committee_id: committee.id,
        type: newType,
        raised_by: newDelegate || null,
        outcome: newOutcome
      }])
      .select('*, users(full_name)')
      .single();

    if (!error && data) {
      setLogs([data, ...logs]);
      
      // Auto-update session status if certain motions pass
      if (newOutcome === 'Passed') {
        if (newType === 'Motion for a Moderated Caucus') {
          setSessionState('Moderated Caucus');
        } else if (newType === 'Motion for an Unmoderated Caucus') {
          setSessionState('Unmoderated Caucus');
        } else if (newType === 'Motion to Suspend the Meeting') {
          setSessionState('On Break');
        } else if (newType === 'Motion to Adjourn the Meeting') {
          setSessionState('Adjourned');
        }
      }

      setNewDelegate('');
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <SectionLabel>Points and Motions Log</SectionLabel>
      
      <div className="flex flex-col gap-3 mb-6 p-4 bg-bg-raised border border-border-subtle rounded-card">
        <select 
          className="bg-bg-card border border-border-input rounded p-2 text-sm focus:border-primary focus:outline-none"
          value={newType}
          onChange={e => setNewType(e.target.value)}
        >
          {MOTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <div className="flex gap-3">
          <select
            className="flex-1 bg-bg-card border border-border-input rounded p-2 text-sm focus:border-primary focus:outline-none"
            value={newDelegate}
            onChange={e => setNewDelegate(e.target.value)}
          >
            <option value="">-- Select Delegate (Optional) --</option>
            {delegates.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
          
          <select
            className="w-32 bg-bg-card border border-border-input rounded p-2 text-sm focus:border-primary focus:outline-none"
            value={newOutcome}
            onChange={e => setNewOutcome(e.target.value)}
          >
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Ruled Out of Order">Out of Order</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          
          <Button variant="default" onClick={handleLogMotion}>Log</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border-subtle ml-2">
          {logs.map(log => (
            <div key={log.id} className="relative pl-8 pb-4">
              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full -ml-[11px] ring-4 ring-bg-card flex items-center justify-center text-[10px] font-bold text-white
                ${log.outcome === 'Passed' ? 'bg-green-500' : 
                  log.outcome === 'Failed' ? 'bg-red-500' : 
                  'bg-yellow-500'}`}
              >
                {log.outcome === 'Passed' ? '✓' : log.outcome === 'Failed' ? '✕' : '!'}
              </div>
              <div className="bg-bg-raised border border-border-subtle p-3 rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-text-primary">{log.type}</span>
                  <span className="text-[10px] text-text-tertiary">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-text-secondary">
                  Raised by: <span className="font-medium">{log.users?.full_name || 'Chair'}</span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center text-text-tertiary py-8 text-sm">No motions logged yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
}